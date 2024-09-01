import { SpanKind, context } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import type { OTLPExporterError } from "@opentelemetry/otlp-exporter-base";
import { Resource } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import type { ExecutionContext } from "hono";
// TODO figure out we can use something else
import { AsyncLocalStorageContextManager } from "./async-hooks";
import { type FpxLogger, getLogger, logExporterSendError } from "./logger";
import { measure } from "./measure";
import {
  patchCloudflareBindings,
  patchConsole,
  patchFetch,
  patchWaitUntil,
} from "./patch";
import { propagateFpxTraceId } from "./propagation";
import { isRouteInspectorRequest, respondWithRoutes } from "./routes";
import type { HonoLikeApp, HonoLikeEnv, HonoLikeFetch } from "./types";
import {
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
    // NOTE - We don't proxy Cloudflare bindings by default yet because it's still experimental, and we don't have fancy UI for it yet in the Studio
    cfBindings: false,
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
          executionContext: ExecutionContext | undefined,
        ) {
          // Patch the related functions to monitor
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
          const endpoint =
            typeof env === "object" && env !== null ? env.FPX_ENDPOINT : null;
          const isEnabled = !!endpoint && typeof endpoint === "string";

          const FPX_LOG_LEVEL = libraryDebugMode ? "debug" : env?.FPX_LOG_LEVEL;
          const logger = getLogger(FPX_LOG_LEVEL);

          if (libraryDebugMode) {
            logger.debug("Library debug mode is enabled");
          }

          if (!isEnabled) {
            logger.debug(
              "@fiberplane/hono-otel is missing FPX_ENDPOINT. Skipping instrumentation",
            );
            return await originalFetch(request, rawEnv, executionContext);
          }

          // If the request is from the route inspector, respond with the routes
          if (isRouteInspectorRequest(request)) {
            logger.debug("Responding to route inspector request");
            return respondWithRoutes(webStandardFetch, endpoint, app);
          }

          const serviceName = env?.FPX_SERVICE_NAME ?? "unknown";

          if (monitorCfBindings) {
            patchCloudflareBindings(env);
          }
          if (monitorLogging) {
            patchConsole();
          }
          if (monitorFetch) {
            patchFetch();
          }

          const provider = setupTracerProvider({
            serviceName,
            endpoint,
            logger
          });

          // Enable tracing for waitUntil
          const patched = executionContext && patchWaitUntil(executionContext);
          const promises = patched?.promises ?? [];
          const proxyExecutionCtx = patched?.proxyContext ?? executionContext;

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
            duplex: body2 ? "half" : undefined,
          });

          // Parse the body and headers for the root request.
          //
          // NOTE - This will add some latency, and it will serialize the env object.
          //        We should not do this in production!
          const rootRequestAttributes = await getRootRequestAttributes(
            requestForAttributes,
            env,
          );

          const measuredFetch = measure(
            {
              name: "request",
              spanKind: SpanKind.SERVER,
              onStart: (span, [request]) => {
                const requestAttributes = {
                  ...getRequestAttributes(request),
                  ...rootRequestAttributes,
                };
                span.setAttributes(requestAttributes);
              },
              onSuccess: async (span, response) => {
                const attributes = await getResponseAttributes(
                  (await response).clone(),
                );
                span.setAttributes(attributes);
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
            return await context.with(activeContext, async () => {
              return await measuredFetch(
                newRequest,
                env as HonoLikeEnv,
                proxyExecutionCtx,
              );
            });
          } finally {
            // Make sure all promises are resolved before sending data to the server
            if (proxyExecutionCtx) {
              proxyExecutionCtx.waitUntil(
                Promise.allSettled(promises).finally(() => {
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
  logger: FpxLogger;
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

  const exporter = new OTLPTraceExporter({
    url: options.endpoint,
  });

  proxySendWithErrorLogging(exporter, options.logger);

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  return provider;
}

/**
 * NOTE - This was my first attempt to be able to hook into errors that happen when
 *        OTEL tries to send the trace to Fiberplane Studio, but there's a network error.
 *        There is likely a more elegant way to do this.
 */
function proxySendWithErrorLogging(
  exporter: OTLPTraceExporter,
  logger: FpxLogger,
) {
  const originalSend = exporter.send.bind(exporter);
  exporter.send = (...args) => {
    console.log('hi from send')
    const modOnError = (e: OTLPExporterError) => {
      console.log('hi')
      if (logger) {
        logExporterSendError(logger, e);
      }
      if (typeof args?.[2] === "function") {
        args[2](e);
      }
    };
    const modArgs: Parameters<typeof originalSend> = [
      args[0],
      args[1],
      modOnError,
    ];
    return originalSend(...modArgs);
  };
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
