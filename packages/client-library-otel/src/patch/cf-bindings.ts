import type { Span } from "@opentelemetry/api";
import {
  CF_BINDING_ERROR,
  CF_BINDING_METHOD,
  CF_BINDING_NAME,
  CF_BINDING_RESULT,
  CF_BINDING_TYPE,
} from "../constants";
import { measure } from "../measure";
import { errorToJson, isUintArray, safelySerializeJSON } from "../utils";

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
  if (!isCloudflareBinding(o)) {
    return o;
  }

  if (isAlreadyProxied(o)) {
    return o;
  }

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

  const d1Proxy = new Proxy(o, {
    get(d1Target, d1Prop) {
      const d1Method = String(d1Prop);
      const d1Value = Reflect.get(d1Target, d1Prop);
      // HACK - These are technically public methods on the database object,
      // but they have an underscore prefix which usually means "private" by convention.
      //
      const isSendingQuery =
        d1Method === "_send" || d1Method === "_sendOrThrow";
      if (typeof d1Value === "function" && isSendingQuery) {
        return measure(
          {
            name: "D1 Query",
            attributes: getCfBindingAttributes(
              "D1Database",
              bindingName,
              d1Method,
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
          d1Value.bind(d1Target),
        );
      }

      return d1Value;
    },
  });

  markAsProxied(d1Proxy);

  return d1Proxy;
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
 * Check if a Cloudflare binding is already proxied by us
 *
 * @param o - The binding to check
 * @returns `true` if the binding is already proxied, `false` otherwise
 */
function isAlreadyProxied(o: object) {
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
