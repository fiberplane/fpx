import { SpanKind, context, propagation } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import type { ExecutionContext, Hono } from "hono";
// TODO figure out we can use something else
import { AsyncLocalStorageContextManager } from "./async-hooks";

import { measure } from "./measure";
import { patchConsole, patchFetch, patchWaitUntil } from "./patch";
import { isRouteInspectorRequest, respondWithRoutes } from "./routes";
import { getRequestAttributes, getResponseAttributes } from "./utils";

type FpxConfig = {
  monitor: {
    /** Send data to FPX about each fetch call made during a handler's lifetime */
    fetch: boolean;
    logging: boolean;
  };
};

// TODO - Create helper type for making deeply partial types
type FpxConfigOptions = Partial<
  FpxConfig & {
    monitor: Partial<FpxConfig["monitor"]>;
  }
>;

const defaultConfig = {
  // libraryDebugMode: false,
  monitor: {
    fetch: true,
    logging: true,
  },
};

// // Type hack that makes our middleware types play nicely with Hono types
// type RouterRoute = {
//   method: string;
//   path: string;
//   // We can't use the type of a handler that's exported by Hono for some reason.
//   // When we do that, our types end up mismatching with the user's app!
//   //
//   // biome-ignore lint/complexity/noBannedTypes:
//   handler: Function;
// };

export function instrument(app: Hono, config?: FpxConfigOptions) {
  const webStandardFetch = fetch;
  return new Proxy(app, {
    // Intercept the `fetch` function on the Hono app instance
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "fetch" && typeof value === "function") {
        const originalFetch = value as Hono["fetch"];
        return async function fetch(
          request: Request,
          env: unknown,
          executionContext: ExecutionContext | undefined,
        ) {
          // NOTE - We used to have a handy default for the fpx endpoint, but we need to remove that,
          //        so that people won't accidentally deploy to production with our middleware and
          //        start sending data to the default url.
          const endpoint =
            typeof env === "object" && env !== null
              ? (env as Record<string, string | null>).FPX_ENDPOINT
              : null;
          const isEnabled = !!endpoint && typeof endpoint === "string";

          if (!isEnabled) {
            return await originalFetch(request, env, executionContext);
          }

          // If the request is from the route inspector, respond with the routes
          if (isRouteInspectorRequest(request)) {
            return respondWithRoutes(webStandardFetch, endpoint, app);
          }

          const serviceName =
            (env as Record<string, string | null>).FPX_SERVICE_NAME ??
            "unknown";

          // Patch the related functions to monitor
          const {
            monitor: { fetch: monitorFetch, logging: monitorLogging },
          } = mergeConfigs(defaultConfig, config);
          if (monitorLogging) {
            patchConsole();
          }
          if (monitorFetch) {
            patchFetch();
          }

          const provider = setupTracerProvider({
            serviceName,
            endpoint,
          });

          // Enable tracing for waitUntil
          const patched = executionContext && patchWaitUntil(executionContext);
          const promises = patched?.promises ?? [];
          const proxyExecutionCtx = patched?.proxyContext ?? executionContext;

          // HACK - We need to extract the traceparent from the request headers
          //        but we also need to set a dummy traceparent in the case that
          //        we are receiving an explicit trace-id to use from FPX.
          //
          // Extract fpx trace ID from request headers (if it exists)
          // and set it as a dummy active context
          //
          // TODO - Validate the id here using an otel helper, and warn if it is invalid
          const traceId = request.headers.get("x-fpx-trace-id");
          console.log("FPX traceId", traceId);

          let activeContext = context.active();
          if (traceId) {
            activeContext = propagation.extract(context.active(), {
              traceparent: createTraceparentHeader(traceId),
            });
          } else {
            activeContext = propagation.extract(
              context.active(),
              request.headers,
            );
          }

          const measuredFetch = measure(
            {
              name: "request",
              spanKind: SpanKind.SERVER,
              onStart: (span, [request]) => {
                span.setAttributes(getRequestAttributes(request));
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
            },
            originalFetch,
          );

          try {
            return await context.with(activeContext, async () => {
              return await measuredFetch(request, env, proxyExecutionCtx);
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
}) {
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
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
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
  return {
    monitor: Object.assign(fallbackConfig.monitor, userConfig?.monitor),
  };
}

function createTraceparentHeader(traceId: string): string {
  const version = "00"; // Version of the traceparent header
  // NOTE - A dummy span id like the following will be rejected by trace propagation API
  //        Look in the otel codebase for their regex - it filters out anything that's just 0 repeating
  //
  // const spanId = '0000000000000000'; // Dummy span ID
  //
  // HACK - Generate a random span id so we can spook a proper trace parent
  //
  const spanId = generateSpanId();
  const traceFlags = "01"; // Trace flags (01 means sampled)

  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

function generateSpanId(): string {
  // Generate a random 16-character hex string that is not all zeros
  let spanId;
  do {
    spanId = [...Array(16)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  } while (/^[0]{16}$/.test(spanId));
  return spanId;
}
