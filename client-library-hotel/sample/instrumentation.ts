import { type Span, SpanStatusCode, context, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import type { ExecutionContext, Hono } from "hono";
import { AsyncLocalStorageContextManager } from "../src/context";
import { enableWaitUntilTracing } from "../src/waitUntil";

// import {
// 	InstrumentationBase,
// 	// InstrumentationConfig,
// 	InstrumentationModuleDefinition,
// 	InstrumentationNodeModuleDefinition,
// 	// InstrumentationNodeModuleFile,
// 	isWrapped,
// } from "@opentelemetry/instrumentation";

// import type * as hono from "hono";
// import { enableWaitUntilTracing } from "../src/waitUntil";

// type Config = {};

// function
// export class HonoInstrumentation extends InstrumentationBase<Config> {
//   // constructor(config: Config = {}) {
//   //   super('@opentelemetry/instrumentation-hono', '1.0.0', config);
//   // }

// 	init():
// 		| undefined
// 		| InstrumentationModuleDefinition
// 		| InstrumentationModuleDefinition[] {
//       console.log('init called');
// 		const module = new InstrumentationNodeModuleDefinition(
// 			"hono",
// 			["*"],
// 			this._onPatchHonoModule,
// 			this._onUnPatchHonoModule,
// 		);

//     return module;
// 	}

// 	private _onPatchHonoModule = (moduleExports: typeof hono) => {
//     console.log('patschiiii', moduleExports.Hono.prototype.fetch)
// 		if (isWrapped(moduleExports.Hono.prototype.fetch)) {
// 			this._unwrap(moduleExports.Hono.prototype, "fetch");
// 		}
// 		this._wrap(moduleExports.Hono.prototype, "fetch", this._getPatchFetch());
//     console.log('patchieeeee', moduleExports);
// 		return moduleExports;
// 	};

// 	private _onUnPatchHonoModule = (moduleExports: typeof hono) => {
// 		this._unwrap(moduleExports.Hono.prototype, "fetch");
// 	};

// 	private _getPatchFetch() {
// 		return (originalFetch: typeof hono.Hono.prototype.fetch) => {
// 			return function fetch(
// 				...args: Parameters<typeof hono.Hono.prototype.fetch>
// 			) {
// 				const [request, env, executionCtx] = args;
// 				const proxyExecutionCtx = executionCtx
// 					? enableWaitUntilTracing(executionCtx)
// 					: undefined;
// 				return originalFetch.call(this, request, env, proxyExecutionCtx);
// 			};
// 		};
// 	}

//   public enable(): void {
//     console.log('enable', super.prototype, 'super')
//     InstrumentationBase.prototype.enable.call(this);
//     // super.enable();
//   }

//   override disable(): void {
//     console.log('disable?');
//   }
// }

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
    endpoint: env?.MIZU_ENDPOINT ?? "http://localhost:8788/v0/traces",
    // service: c.env?.SERVICE_NAME || "unknown",
    libraryDebugMode: env?.LIBRARY_DEBUG_MODE,
    monitor: {
      fetch: true,
      logging: true,
      requests: true,
    },
  } as Config;
};

type FetchFn = typeof Hono.prototype.fetch;

export function instrument(
  app: Hono,
  options?: { createConfig?: CreateConfig },
) {
  const createConfig = options?.createConfig ?? defaultCreateConfig;

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
          const result = await withSpan(next);

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

async function withSpan(fn: () => any) {
  const handleRouteSpan = (span: Span) => {
    return Promise.resolve()
      .then(fn)
      .then((result) => {
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      })
      .catch((error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      })
      .finally(() => {
        span.end();
      });
  };

  const tracer = trace.getTracer("otel-example-tracer-node");
  return await tracer.startActiveSpan("route", handleRouteSpan);
}
