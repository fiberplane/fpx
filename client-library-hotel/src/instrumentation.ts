import { context, trace } from "@opentelemetry/api";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { ExecutionContext, Hono } from "hono";
import { AsyncLocalStorageContextManager } from "./context";
import { enableWaitUntilTracing } from "./waitUntil";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";

import { withSpan } from "./util";
import { wrap,  } from "shimmer";

type Config = {
  endpoint: string;
  /** Name of service (not in use, but will be helpful later) */
  // service?: string;
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
    endpoint: env?.MIZU_ENDPOINT ?? "http://localhost:4317",
    // service: c.env?.SERVICE_NAME || "unknown",
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

  
  wrap(console, "log", (original) => {
    return function (message: string, ...args: any[]) {
      const span = trace.getActiveSpan()
      if (span) {
        span.addEvent("log", { message, level: "info", arguments: JSON.stringify(args)  });
      }
      return original(message, ...args);
    };
  });

  return new Proxy(app, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "fetch" && typeof value === "function") {
        return async function fetch(
          request: Request,
          env: Record<string, string>,
          executionCtx: ExecutionContext,
        ) {
          const config = createConfig(env);

          const provider = setupTracerProvider(config);

          // Enable tracing for waitUntil
          const proxyExecutionCtx = executionCtx
            ? enableWaitUntilTracing(executionCtx)
            : undefined;

          const next = () => value(request, env, proxyExecutionCtx);
          const result = await withSpan("route", next);

          executionCtx.waitUntil(provider.forceFlush());
          return result;
        };
      }

      if (prop === "mizu") {
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function setupTracerProvider(config: Config) {
  const asyncHooksContextManager = new AsyncLocalStorageContextManager();
  context.setGlobalContextManager(asyncHooksContextManager);
  const provider = new BasicTracerProvider();
  const exporter = new OTLPTraceExporter({
    url: config.endpoint,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  return provider;
}
