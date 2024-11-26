import type { Span } from "@opentelemetry/api";
import {
  CF_BINDING_ERROR,
  CF_BINDING_METHOD,
  CF_BINDING_NAME,
  CF_BINDING_RESULT,
  CF_BINDING_TYPE,
} from "../constants";
import { measure } from "../measure";
import {
  errorToJson,
  isObject,
  isUintArray,
  objectWithKey,
  safelySerializeJSON,
} from "../utils";

/**
 * A key used to mark objects as proxied by us, so that we don't proxy them again.
 *
 * @internal
 */
const IS_PROXIED_KEY = "__fpx_proxied";

/**
 * Patch Cloudflare bindings to add instrumentation
 *
 * @param env - The environment for the worker, which may contain Cloudflare bindings
 */
export function patchCloudflareBindings(
  env?: Record<string, string | null | object> | null,
) {
  const envKeys = env ? Object.keys(env) : [];
  for (const bindingName of envKeys) {
    // Skip any environment variables that are not objects,
    // since they can't be bindings
    const envValue = env?.[bindingName];
    if (!envValue || typeof envValue !== "object") {
      continue;
    }

    env[bindingName] = patchCloudflareBinding(envValue, bindingName);
  }
}

/**
 * Proxy a Cloudflare binding to add instrumentation.
 * For now, just wraps all functions on the binding to use a measured version of the function.
 *
 * For R2, we could still specifically proxy and add smarts for:
 * - createMultipartUpload
 * - resumeMultipartUpload
 *
 * @param o - The binding to proxy
 * @param bindingName - The name of the binding in the environment, e.g., "AI" or "AVATARS_BUCKET"
 *
 * @returns A proxied binding
 */
function patchCloudflareBinding(o: object, bindingName: string) {
  // HACK - Check this first...
  if (isCloudflareWorkerBinding(o)) {
    return proxyServiceBinding(o, bindingName);
  }

  if (!isCloudflareBinding(o)) {
    console.log("Is not bindnding:", bindingName, o);
    return o;
  }

  console.log("We have a binding", bindingName);

  if (isAlreadyProxied(o)) {
    return o;
  }

  console.log("Proxying binding", bindingName);

  // HACK - Special logic for D1, since we only really care about the `_send` and `_sendOrThrow` methods,
  //        not about the `prepare`, etc, methods.
  if (isCloudflareD1Binding(o)) {
    return proxyD1Binding(o, bindingName);
  }

  const proxiedBinding = new Proxy(o, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value === "function") {
        const methodName = String(prop);
        console.log("Proxied method", methodName);

        // OPTIMIZE - Do we want to do these lookups / this wrapping every time the property is accessed?
        const bindingType = getConstructorName(target);

        // The name for the span, which will show up in the UI
        const name = `${bindingName}.${methodName}`;

        const measuredBinding = measure(
          {
            name,
            attributes: getCfBindingAttributes(
              bindingType,
              bindingName,
              methodName,
            ),
            onStart: (span, args) => {
              span.setAttributes({
                args: safelySerializeJSON(args),
              });
            },
            onSuccess: (span, result) => {
              addResultAttribute(span, result);
            },
            onError: handleError,
          },
          // OPTIMIZE - bind is expensive, can we avoid it?
          value.bind(target),
        );
        return measuredBinding;
      }

      return value;
    },
  });

  // We need to mark the binding as proxied so that we don't proxy it again in the future,
  // since Workers can re-use env vars across requests.
  markAsProxied(proxiedBinding);

  return proxiedBinding;
}

/**
 * Proxy a Service binding to add instrumentation
 *
 * @param o - The Service binding to proxy
 *
 * @returns A proxied binding
 */
function proxyServiceBinding(o: object, bindingName: string) {
  if (!isCloudflareWorkerBinding(o)) {
    return o;
  }

  if (isAlreadyProxied(o)) {
    return o;
  }

  console.log("Proxying service binding!!!", bindingName);

  const proxiedBinding = new Proxy(o, {
    get(serviceTarget, serviceProp) {
      const serviceMethod = String(serviceProp);
      if (serviceMethod === "bark") {
        console.log("barking mad!");
      }
      console.log("Proxying service method", serviceMethod);
      const serviceValue = Reflect.get(serviceTarget, serviceProp);
      console.log("service value", serviceValue);

      // NOTE - Should ignore "toJSON"
      if (serviceMethod === "toJSON") {
        return serviceValue;
      }

      // NOTE - Can probably throw this away...
      if (serviceMethod === "apply") {
        console.log("Skipping proxying of apply", serviceValue);
        return serviceValue;
      }

      if (serviceMethod === "fetch") {
        return serviceValue;
      }

      if (serviceMethod === "connect") {
        return serviceValue;
      }

      if (serviceMethod === "constructor") {
        return serviceValue;
      }

      if (typeof serviceValue === "function") {
        const bindingType = "Worker";

        // The name for the span, which will show up in the UI
        const name = `${bindingName}.${serviceMethod}`;

        const measuredBinding = measure(
          {
            name,
            attributes: getCfBindingAttributes(
              bindingType,
              bindingName,
              serviceMethod,
            ),
            onStart: (span, args) => {
              span.setAttributes({
                args: safelySerializeJSON(args),
              });
            },
            onSuccess: (span, result) => {
              addResultAttribute(span, result);
            },
            onError: handleError,
          },
          serviceValue,
        );

        // TODO - Should we bind here?
        return measuredBinding.bind(serviceTarget);
      }

      return serviceValue;
    },
  });

  markAsProxied(proxiedBinding);

  return proxiedBinding;
}

/**
 * Proxy a D1 binding to add instrumentation to database calls.
 *
 * In order to instrument the calls to the database itself, we need to proxy the `_send` and `_sendOrThrow` methods.
 * As of writing, the code that makes these calls is here:
 * https://github.com/cloudflare/workerd/blob/bee639d6c2ff41bfc1bd75a40c9d3c98724585ce/src/cloudflare/internal/d1-api.ts#L131
 *
 * @param o - The D1Database binding to proxy
 *
 * @returns A proxied binding, whose `.database._send` and `.database._sendOrThrow` methods are instrumented
 */
function proxyD1Binding(o: object, bindingName: string) {
  if (!isCloudflareD1Binding(o)) {
    return o;
  }

  if (isAlreadyProxied(o)) {
    return o;
  }

  // This is how we monitor db calls in versions of miniflare after: https://github.com/cloudflare/workerd/commit/11661908ea8b6825b6d91703717f12daa6688db9
  if (hasCloudflareD1Session(o)) {
    if (!isAlreadyProxied(o.alwaysPrimarySession)) {
      const proxiedPrimarySession = new Proxy(o.alwaysPrimarySession, {
        get(primarySessionTarget, primarySessionProp) {
          return measureD1Queries(
            bindingName,
            primarySessionTarget,
            primarySessionProp,
          );
        },
      });
      markAsProxied(proxiedPrimarySession);
      o.alwaysPrimarySession = proxiedPrimarySession;
    }
  }

  // This is how we monitor db calls in versions of miniflare before https://github.com/cloudflare/workerd/commit/11661908ea8b6825b6d91703717f12daa6688db9
  const d1Proxy = new Proxy(o, {
    get(d1Target, d1Prop) {
      return measureD1Queries(bindingName, d1Target, d1Prop);
    },
  });

  markAsProxied(d1Proxy);

  return d1Proxy;
}

function measureD1Queries(
  bindingName: string,
  d1Target: object,
  d1Prop: string | symbol,
) {
  const d1Method = String(d1Prop);
  const d1Value = Reflect.get(d1Target, d1Prop);

  // HACK - These are technically public methods on the database object,
  // but they have an underscore prefix which usually means "private" by convention.
  //
  const isSendingQuery = d1Method === "_send" || d1Method === "_sendOrThrow";
  if (typeof d1Value === "function" && isSendingQuery) {
    return measure(
      {
        name: "D1 Query",
        attributes: getCfBindingAttributes("D1Database", bindingName, d1Method),
        onStart: (span, args) => {
          span.setAttributes({
            args: safelySerializeJSON(args),
          });
        },
        onSuccess: (span, result) => {
          addResultAttribute(span, result);
        },
        onError: handleError,
      },
      // OPTIMIZE - bind is expensive, can we avoid it?
      d1Value.bind(d1Target),
    );
  }

  return d1Value;
}

/**
 * Get the attributes for a Cloudflare binding
 *
 * @param bindingType - The type of the binding, e.g., "D1Database" or "R2Bucket"
 * @param bindingName - The name of the binding in the environment, e.g., "AI" or "AVATARS_BUCKET"
 * @param methodName - The name of the method being called on the binding, e.g., "run" or "put"
 *
 * @returns The attributes for the binding
 */
function getCfBindingAttributes(
  bindingType: string,
  bindingName: string,
  methodName: string,
) {
  return {
    [CF_BINDING_TYPE]: bindingType,
    [CF_BINDING_NAME]: bindingName,
    [CF_BINDING_METHOD]: methodName,
  };
}

/**
 * Add "cf.binding.result" attribute to a span
 *
 * @NOTE - The results of method calls could be so wildly different, and sometimes very large.
 *         We should be more careful here with what we attribute to the span.
 *         Also, might want to turn this off by default in production.
 *
 * @param span - The span to add the attribute to
 * @param result - The result to add to the span
 */
function addResultAttribute(span: Span, result: unknown) {
  // HACK - Probably a smarter way to avoid serlializing massive amounts of binary data, but this works for now
  const isBinary = isUintArray(result);
  span.setAttributes({
    [CF_BINDING_RESULT]: isBinary ? "binary" : safelySerializeJSON(result),
  });
}

/**
 * Add "cf.binding.error" attribute to a span
 *
 * @param span - The span to add the attribute to
 * @param error - The error to add to the span
 */
function handleError(span: Span, error: unknown) {
  const serializableError = error instanceof Error ? errorToJson(error) : error;
  const errorAttributes = {
    [CF_BINDING_ERROR]: safelySerializeJSON(serializableError),
  };
  span.setAttributes(errorAttributes);
}

// TODO - Remove this, it is temporary
function isCloudflareBinding(o: unknown): o is object {
  return (
    isCloudflareWorkerBinding(o) ||
    isCloudflareAiBinding(o) ||
    isCloudflareR2Binding(o) ||
    isCloudflareD1Binding(o) ||
    isCloudflareKVBinding(o)
  );
}

function isCloudflareAiBinding(o: unknown) {
  const constructorName = getConstructorName(o);
  if (constructorName !== "Ai") {
    return false;
  }

  // TODO - Edge case, also check for `fetcher` and other known properties on this binding, in case the user is using another class named Ai (?)
  return true;
}

function isCloudflareR2Binding(o: unknown) {
  const constructorName = getConstructorName(o);
  if (constructorName !== "R2Bucket") {
    return false;
  }

  // TODO - Edge case, also check for `list`, `delete`, and other known methods on this binding, in case the user is using another class named R2Bucket (?)
  return true;
}

function isCloudflareD1Binding(o: unknown) {
  const constructorName = getConstructorName(o);
  if (constructorName !== "D1Database") {
    return false;
  }

  return true;
}

/**
 * Check if an object is a Cloudflare Worker binding
 *
 * This uses some heuristics to check for a Worker binding, since `instanceof WorkerEntrypoint` does not work.
 *
 * @param o - The object to check
 * @returns `true` if the object is a Cloudflare Worker binding, `false` otherwise
 */
function isCloudflareWorkerBinding(o: unknown): boolean {
  const isFetcher = getConstructorName(o) === "Fetcher";
  return (
    isFetcher &&
    hasFunctionWithName(o, "fetch") &&
    hasFunctionWithName(o, "connect")
  );
}

function hasCloudflareD1Session(
  o: unknown,
): o is { alwaysPrimarySession: object } {
  return (
    objectWithKey(o, "alwaysPrimarySession") && isObject(o.alwaysPrimarySession)
  );
}

function isCloudflareKVBinding(o: unknown) {
  const constructorName = getConstructorName(o);
  if (constructorName !== "KvNamespace") {
    return false;
  }

  return true;
}

/**
 * Get the constructor name of an object
 *
 * Helps us detect Cloudflare bindings
 *
 * @param o - The object to get the constructor name of
 * @returns The constructor name
 *
 * Example:
 * ```ts
 * const o = new Ai();
 * getConstructorName(o); // "Ai"
 * ```
 */
function getConstructorName(o: unknown) {
  return Object.getPrototypeOf(o).constructor.name;
}

/**
 * Check if an object has a function property with a given name
 *
 * @param o - The object to check
 * @param name - The name of the function to check for
 * @returns `true` if the object has a function with the given name, `false` otherwise
 */
function hasFunctionWithName(o: unknown, name: string): boolean {
  const result =
    o &&
    typeof o === "object" &&
    name in o &&
    typeof (o as Record<string, unknown>)[name] === "function";

  return !!result;
}

/**
 * Check if a Cloudflare binding is already proxied by us
 *
 * @param o - The binding to check
 * @returns `true` if the binding is already proxied, `false` otherwise
 */
function isAlreadyProxied(o: object) {
  console.log("Checking if already proxied", o);

  // This is crazy, but it seems like any property access on a worker binding will be true,
  // since the property access returns a ... function with native code?!
  //
  if (isCloudflareWorkerBinding(o)) {
    console.log("Checking if worker binding is already proxied...");
    const descriptor = getProxiedKey(o);
    console.log("the descriptor", descriptor);
    return !!descriptor;
    // biome-ignore lint/correctness/noUnreachable: <explanation>
    return (
      IS_PROXIED_KEY in o &&
      typeof o[IS_PROXIED_KEY] === "boolean" &&
      o[IS_PROXIED_KEY]
    );
  }

  if (IS_PROXIED_KEY in o) {
    return !!o[IS_PROXIED_KEY];
  }

  return false;
}

/**
 * Mark a Cloudflare binding as proxied by us, so that we don't proxy it again
 *
 * @param o - The binding to mark
 */
function markAsProxied(o: object) {
  Object.defineProperty(o, IS_PROXIED_KEY, {
    value: true,
    writable: true,
    configurable: true,
  });
}

function getProxiedKey(o: object) {
  return Object.getOwnPropertyDescriptor(o, IS_PROXIED_KEY);
}
