import { type Span, SpanStatusCode, context, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { Context } from "hono";
import { AsyncLocalStorageContextManager } from "./context";

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

type CreateConfig = (context: Context) => Config;

const defaultCreateConfig = (c: Context) => {
  return {
    endpoint: c.env?.MIZU_ENDPOINT ?? "http://localhost:8788/v0/traces",
    // service: c.env?.SERVICE_NAME || "unknown",
    libraryDebugMode: c.env?.LIBRARY_DEBUG_MODE,
    monitor: {
      fetch: true,
      logging: true,
      requests: true,
    },
  };
};

export function createHonoMiddleware(options?: {
  createConfig: CreateConfig;
}) {
  const createConfig = options?.createConfig ?? defaultCreateConfig;
  return async function honoMiddleware(c: Context, next: () => Promise<void>) {
    const config = createConfig(c);

    // console.log("about to create a manager... oh boy");
    const asyncHooksContextManager = new AsyncLocalStorageContextManager();
    // console.log("manager created", asyncHooksContextManager);
    context.setGlobalContextManager(asyncHooksContextManager);
    const provider = new BasicTracerProvider();
    // const consoleExporter = new ConsoleSpanExporter();
    // const consoleSpanProcessor = new SimpleSpanProcessor(consoleExporter);
    // provider.addSpanProcessor(consoleSpanProcessor);
    const exporter = new OTLPTraceExporter({
      url: config.endpoint,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    // const {
    // endpoint,
    // service,
    // libraryDebugMode,
    // monitor: {
    // fetch: monitorFetch,
    // TODO - implement these controls/features
    // logging: monitorLogging,
    // requests: monitorRequests,
    // },
    // } = createConfig(c);
    // console.log(createConfig(c));
    // const ctx = c.executionCtx;
    // NOTE - Polyfilling `waitUntil` is probably not necessary for Cloudflare workers, but could be good for vercel envs
    //         https://github.com/highlight/highlight/pull/6480
    // polyfillWaitUntil(ctx);

    // Create spans for waitUntil
    // enableWaitUntilTracing(ctx);

    // const teardownFunctions: Array<() => void> = [];
    // const tracer = trace.getTracer("otel-example-tracer-node");
    // const span = trace.getActiveSpan();

    const handleRouteSpan = (span: Span) => {
      return Promise.resolve()
        .then(next)
        .then(() => {
          console.log("done calling next");
          span.setStatus({ code: SpanStatusCode.OK });
        })
        .catch((error) => {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        })
        .finally(() => {
          console.log("ending span");
          span.end();
        });
    };

    const tracer = trace.getTracer("otel-example-tracer-node");
    await tracer.startActiveSpan("route", handleRouteSpan);
    await provider.forceFlush();
  };
}
