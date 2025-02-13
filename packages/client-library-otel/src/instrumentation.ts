import { SpanKind, context } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  // BatchSpanProcessor,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import type { ExecutionContext } from "hono";
// TODO figure out we can use something else
import { AsyncLocalStorageContextManager } from "./async-hooks";
import {
  ENV_FPX_AUTH_TOKEN,
  ENV_FPX_ENDPOINT,
  ENV_FPX_LOG_LEVEL,
  ENV_FPX_SERVICE_NAME,
} from "./constants";
import { getLogger } from "./logger";
import { measure } from "./measure";
import {
  patchCloudflareBindings,
  patchConsole,
  patchFetch,
  patchWaitUntil,
} from "./patch";
import { PromiseStore } from "./promiseStore";
import { propagateFpxTraceId } from "./propagation";
import {
  isRouteInspectorRequest,
  respondWithRoutes,
  sendRoutes,
} from "./routes";
import type { HonoLikeApp, HonoLikeEnv, HonoLikeFetch } from "./types";
import {
  getFromEnv,
  getRequestAttributes,
  getResponseAttributes,
  getRootRequestAttributes,
} from "./utils";

/**
 * The type for the configuration object we use to configure the instrumentation
 * Different from @FpxConfigOptions because all properties are required
 *
 * @internal
 */
type FpxConfig = {
  /** Enable library debug logging */
  libraryDebugMode: boolean;
  monitor: {
    /** Send data to FPX about each `fetch` call made during a handler's lifetime */
    fetch: boolean;
    /** Send data to FPX about each `console.*` call made during a handler's lifetime */
    logging: boolean;
    /** Proxy Cloudflare bindings to add instrumentation */
    cfBindings: boolean;
  };
};

/**
 * The type for the configuration object the user might pass to `instrument`
 * Different from @FpxConfig because all properties are optional
 *
 * @public
 */
type FpxConfigOptions = Partial<
  FpxConfig & {
    monitor: Partial<FpxConfig["monitor"]>;
  }
>;

const defaultConfig = {
  libraryDebugMode: false,
  monitor: {
    fetch: true,
    logging: true,
    cfBindings: true,
  },
};

export function instrument(app: HonoLikeApp, config?: FpxConfigOptions) {
  // Freeze the web standard fetch function so that we can use it below to report registered routes back to fpx studio
  const webStandardFetch = fetch;

  return new Proxy(app, {
    // Intercept the `fetch` function on the Hono app instance
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "fetch" && typeof value === "function") {
        const originalFetch = value as HonoLikeFetch;
        return async function fetch(
          request: Request,
          // Name this "rawEnv" because we coerce it below into something that's easier to work with
          rawEnv: HonoLikeEnv,
          executionContext?: ExecutionContext,
        ) {
          // Merge the default config with the user's config
          const {
            libraryDebugMode,
            monitor: {
              fetch: monitorFetch,
              logging: monitorLogging,
              cfBindings: monitorCfBindings,
            },
          } = mergeConfigs(defaultConfig, config);

          const env = rawEnv as
            | undefined
            | null
            | Record<string, string | null>;

          // NOTE - We do *not* want to have a default for the FPX_ENDPOINT,
          //        so that people won't accidentally deploy to production with our middleware and
          //        start sending data to the default url.
          const endpoint = getFromEnv(env, ENV_FPX_ENDPOINT);
          const isEnabled = !!endpoint && typeof endpoint === "string";
          const isLocal: boolean = endpoint?.includes("localhost") ?? false;

          const authToken = getFromEnv(env, ENV_FPX_AUTH_TOKEN);

          const FPX_LOG_LEVEL = libraryDebugMode
            ? "debug"
            : getFromEnv(env, ENV_FPX_LOG_LEVEL);
          const logger = getLogger(FPX_LOG_LEVEL);
          // NOTE - This should only log if the FPX_LOG_LEVEL is "debug"
          logger.debug("Library debug mode is enabled");

          const FPX_IS_LOCAL = isLocal;
          logger.debug(
            FPX_IS_LOCAL
              ? "Library local mode is enabled"
              : "Library local mode is disabled",
          );

          if (!isEnabled) {
            logger.debug(
              "@fiberplane/hono-otel is missing FPX_ENDPOINT. Skipping instrumentation",
            );
            return await originalFetch(request, rawEnv, executionContext);
          }

          // Ignore instrumentation for requests that have the x-fpx-ignore header
          // This is useful for not triggering infinite loops when the OpenAPI spec is fetched from Studio
          if (request.headers.get("x-fpx-ignore")) {
            logger.debug("Ignoring request");
            return await originalFetch(request, rawEnv, executionContext);
          }

          // If the request is from the route inspector, send latest routes to the Studio API and respond with 200 OK
          if (isRouteInspectorRequest(request)) {
            logger.debug("Responding to route inspector request");
            const response = await respondWithRoutes(
              webStandardFetch,
              endpoint,
              app,
              logger,
            );
            logger.debug("Response from route submission", response);
            return response;
          }

          const serviceName =
            getFromEnv(env, ENV_FPX_SERVICE_NAME) ?? "unknown";

          // Patch all functions we want to monitor in the runtime
          if (monitorCfBindings) {
            patchCloudflareBindings(env);
          }
          if (monitorLogging) {
            patchConsole();
          }
          if (monitorFetch) {
            patchFetch({ isLocal: FPX_IS_LOCAL });
          }

          const provider = setupTracerProvider({
            serviceName,
            endpoint,
            authToken: authToken || undefined,
          });

          const promiseStore = new PromiseStore();

          // NOTE - We want to report the latest routes to Studio on every request,
          //        so that we have an up-to-date list of routes in the UI.
          //        This will place the request in the promise store, so that we can
          //        send the routes in the background while still ensuring the request
          //        completes as usual.
          //
          // NOTE - We only want to send routes to the local endpoint (Studio), because it's
          //        not needed for the remote endpoint (Fiberplane API).
          if (FPX_IS_LOCAL) {
            sendRoutes(webStandardFetch, endpoint, app, logger, promiseStore);
          }

          // Enable tracing for waitUntil
          const proxyExecutionCtx =
            executionContext && patchWaitUntil(executionContext, promiseStore);

          const activeContext = propagateFpxTraceId(request);

          // HACK - Duplicate request to be able to read the body and other metadata
          //        in the middleware without messing up the original request
          const clonedRequest = request.clone();
          const [body1, body2] = clonedRequest.body
            ? clonedRequest.body.tee()
            : [null, null];

          // In order to keep `onStart` synchronous (below), we construct
          // some necessary attributes here, using a cloned request
          const requestForAttributes = new Request(clonedRequest.url, {
            method: request.method,
            headers: new Headers(request.headers),
            body: body1,

            // NOTE - This is a workaround to support node environments
            //        Which will throw errors when body is a stream but duplex is not set
            //        https://github.com/nodejs/node/issues/46221
            // @ts-expect-error - duplex is available in nodejs-compat but cloudflare types
            // don't seem to pick it up
            duplex: body1 ? "half" : undefined,
          });

          // Replace the original request's body with the second stream
          const newRequest = new Request(clonedRequest, {
            body: body2,
            headers: new Headers(request.headers),
            method: request.method,
            // NOTE - This is a workaround to support node environments
            //        Which will throw errors when body is a stream but duplex is not set
            //        https://github.com/nodejs/node/issues/46221
            // @ts-expect-error - duplex is available in nodejs-compat but cloudflare types
            // don't seem to pick it up
            duplex: body2 ? "half" : undefined,
          });

          // Parse the body and headers for the root request.
          //
          // NOTE - This will add some latency, and it will serialize the env object.
          //        We should not do this in production!
          const rootRequestAttributes = await getRootRequestAttributes(
            requestForAttributes,
            env,
            {
              isLocal: FPX_IS_LOCAL,
            },
          );

          const measuredFetch = measure(
            {
              name: "request",
              spanKind: SpanKind.SERVER,
              onStart: (span, [request]) => {
                const requestAttributes = {
                  ...getRequestAttributes(request, undefined, {
                    isLocal: FPX_IS_LOCAL,
                  }),
                  ...rootRequestAttributes,
                };
                span.setAttributes(requestAttributes);
              },
              endSpanManually: true,
              onSuccess: async (span, response) => {
                span.addEvent("first-response");

                const attributesResponse = response.clone();

                const updateSpan = async (response: Response) => {
                  const attributes = await getResponseAttributes(response, {
                    isLocal: FPX_IS_LOCAL,
                  });
                  span.setAttributes(attributes);
                  span.end();
                };

                promiseStore.add(updateSpan(attributesResponse));
              },
              checkResult: async (result) => {
                const r = await result;
                if (r.status >= 500) {
                  throw new Error(r.statusText);
                }
              },
              logger,
            },
            originalFetch,
          );

          try {
            return await context.with(activeContext, () =>
              measuredFetch(newRequest, rawEnv, proxyExecutionCtx),
            );
          } finally {
            // Make sure all promises are resolved before sending data to the server
            if (proxyExecutionCtx) {
              proxyExecutionCtx.waitUntil(
                promiseStore.allSettled().finally(() => {
                  return provider.forceFlush();
                }),
              );
            } else {
              // Otherwise just await flushing the provider
              await provider.forceFlush();
            }
          }
        };
      }

      // Keep all the other things accessible
      return value;
    },
  });
}

function setupTracerProvider(options: {
  serviceName: string;
  endpoint: string;
  authToken?: string;
}) {
  // We need to use async hooks to be able to propagate context
  const asyncHooksContextManager = new AsyncLocalStorageContextManager();
  asyncHooksContextManager.enable();
  context.setGlobalContextManager(asyncHooksContextManager);
  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: options.serviceName,
    }),
  });

  const headers: Record<string, string> = options.authToken
    ? { Authorization: `Bearer ${options.authToken}` }
    : {};

  const exporter = new OTLPTraceExporter({
    url: options.endpoint,
    headers,
  });
  provider.addSpanProcessor(
    new SimpleSpanProcessor(exporter),
    // new BatchSpanProcessor(exporter, {
    //   maxQueueSize: 1000,
    //   scheduledDelayMillis: 2,
    // }),
  );
  provider.register();
  return provider;
}

/**
 * Last-in-wins deep merge for FpxConfig
 */
function mergeConfigs(
  fallbackConfig: FpxConfig,
  userConfig?: FpxConfigOptions,
): FpxConfig {
  const libraryDebugMode =
    typeof userConfig?.libraryDebugMode === "boolean"
      ? userConfig.libraryDebugMode
      : fallbackConfig.libraryDebugMode;

  return {
    libraryDebugMode,
    monitor: Object.assign(fallbackConfig.monitor, userConfig?.monitor),
  };
}
