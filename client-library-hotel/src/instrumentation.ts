import { context, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { ExecutionContext, Hono } from "hono";
import { AsyncLocalStorageContextManager } from "./context";
import { enableWaitUntilTracing } from "./waitUntil";

import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { wrap } from "shimmer";
import { withSpan } from "./util";

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

  wrap(console, "log", (original) => {
    return (message: string, ...args: unknown[]) => {
      const span = trace.getActiveSpan();
      // original("log", !!span);
      if (span) {
        span.addEvent("log", {
          message,
          level: "info",
          arguments: JSON.stringify(args),
        });
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
  asyncHooksContextManager.enable();
  context.setGlobalContextManager(asyncHooksContextManager);
  const provider = new BasicTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: config.service,
    }),
  });
  // context.setGlobalTracerProvider(provider);
  const exporter = new OTLPTraceExporter({
    //   url: `${config.endpoint}/api/v1/spans`,
    // });
    // const exporter = new JaegerExporter({
    // url: 'http://localhost:6832/api/traces',
    // url: 'http://localhost:9411/api/v2/spans',
    // url: 'http://localhost:4318',
    // hostname: 'localhost',
    url: config.endpoint,
    // port: 4318,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  provider.register();
  return provider;
}
