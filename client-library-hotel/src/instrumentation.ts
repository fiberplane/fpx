import { context, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { ExecutionContext, Hono } from "hono";
import { AsyncLocalStorageContextManager } from "./context";
import { Resource } from "@opentelemetry/resources";
import {
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_URL,
  SEMRESATTRS_SERVICE_NAME,
} from "@opentelemetry/semantic-conventions";

import { patchWaitUntil,  patchFetch, patchConsole } from "./patch";
import { measure } from "./util";

type Config = {
  endpoint: string;
  /** Name of service (not in use, but will be helpful later) */
  service: string;
  /** Use `libraryDebugMode` to log into the terminal what we are sending to the Mizu server on each request/response */
  libraryDebugMode?: boolean;
  monitor: {
    /** Send data to mizu about each fetch call made during a handler's lifetime */
    fetch: boolean;
    // TODO - implement this control/feature
    logging: boolean;
    /** Send data to mizu about each incoming request and outgoing response */
    requests: boolean;
  };
};

type CreateConfig = (env: Record<string, string>) => Config;

const defaultCreateConfig = (env?: Record<string, string>) => {
  return {
    endpoint: env?.FPX_ENDPOINT ?? "http://localhost:4318/v1/traces",
    service: env?.SERVICE_NAME || "unknown",
    libraryDebugMode: env?.LIBRARY_DEBUG_MODE,
    monitor: {
      fetch: true,
      logging: true,
      requests: true,
    },
  } as Config;
};

export function instrument(
  app: Hono,
  options?: { createConfig?: CreateConfig },
) {
  const createConfig = options?.createConfig ?? defaultCreateConfig;

  patchConsole();
  patchFetch();
  return new Proxy(app, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "fetch" && typeof value === "function") {
        return async function fetch(
          request: Request,
          env: unknown,
          executionCtx: ExecutionContext | undefined,
        ) {
          const config = createConfig(
            typeof env === "object" ? (env as Record<string, string>) : {},
          );

          const provider = setupTracerProvider(config);

          // Enable tracing for waitUntil
          const patched = executionCtx && patchWaitUntil(executionCtx);
          const promises = patched?.promises ?? [];
          const proxyExecutionCtx = patched?.proxyContext ?? executionCtx;

          const next = measure("route", async () => {
            trace.getActiveSpan()?.setAttributes({
              [SEMATTRS_HTTP_URL]: request.url,
              [SEMATTRS_HTTP_METHOD]: request.method,
            });
            // trace.
            return await value(request, env, proxyExecutionCtx);
          });

          const result = await next();

          // Make sure all promises are resolved before sending data to the server
          proxyExecutionCtx?.waitUntil(
            Promise.all(promises).finally(() => {
              return provider.forceFlush();
            }),
          );
          return result;
        };
      }
    },
  });
}

function setupTracerProvider(config: Config) {
  const asyncHooksContextManager = new AsyncLocalStorageContextManager();
  asyncHooksContextManager.enable();
  context.setGlobalContextManager(asyncHooksContextManager);
  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: config.service,
    }),
  });

  const exporter = new OTLPTraceExporter({
    url: config.endpoint,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  return provider;
}
