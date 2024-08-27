import { measure } from "./measure";
import { errorToJson, safelySerializeJSON } from "./utils";

// TODO - Can we use a Symbol here instead?
const IS_PROXIED_KEY = "__fpx_proxied";

/**
 * Proxy a Cloudflare binding to add instrumentation.
 * For now, just wraps all functions on the binding to use a measured version of the function.
 *
 * For R2, we could specifically proxy and add smarts for:
 * - get
 * - list
 * - head
 * - put
 * - delete
 * - createMultipartUpload
 * - resumeMultipartUpload
 *
 * @param o - The binding to proxy
 * @param bindingName - The name of the binding in the environment, e.g., "Ai" or "AVATARS_BUCKET"
 *
 * @returns A proxied binding
 */
export function proxyCloudflareBinding(o: unknown, bindingName: string) {
  // HACK - This makes typescript happier about proxying the object
  if (!o || typeof o !== "object") {
    return o;
  }

  if (!isCloudflareBinding(o)) {
    return o;
  }

  if (isAlreadyProxied(o)) {
    return o;
  }

  // HACK - Clean this up. Special logic for D1.
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

        // Use the user's binding name, not the Cloudflare constructor name
        const name = `${bindingName}.${methodName}`;
        const measuredBinding = measure(
          {
            name,
            attributes: {
              "cf.binding.method": methodName,
              "cf.binding.name": bindingName,
              "cf.binding.type": bindingType,
            },
            onStart: (span, args) => {
              span.setAttributes({
                args: safelySerializeJSON(args),
              });
            },
            // TODO - Use this callback to add additional attributes to the span regarding the response...
            //        But the thing is, the result could be so wildly different depending on the method!
            //        Might be good to proxy each binding individually, eventually?
            //
            // onSuccess: (span, result) => {},
            onError: (span, error) => {
              const serializableError =
                error instanceof Error ? errorToJson(error) : error;
              const errorAttributes = {
                "cf.binding.error": safelySerializeJSON(serializableError),
              };
              span.setAttributes(errorAttributes);
            },
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

// TODO - Remove this, it is temporary
function isCloudflareBinding(o: unknown): o is object {
  return (
    isCloudflareAiBinding(o) ||
    isCloudflareR2Binding(o) ||
    isCloudflareD1Binding(o) ||
    isCloudflareKVBinding(o)
  );
}

/**
 * Get the constructor name of an object
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

/**
 * Proxy a D1 binding to add instrumentation.
 * 
 * What this actually does is create a proxy of the `database` prop... I hope this works
 *
 * @param o - The D1Database binding to proxy
 *
 * @returns A proxied binding, whose `.database._send` and `.database._sendOrThrow` methods are instrumented
 */
function proxyD1Binding(o: unknown, bindingName: string) {
  if (!o || typeof o !== "object") {
    return o;
  }

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
      // but they have an underscore prefix which usually means "private" by convention...
      // BEWARE!!!
      const isSendingMethod = d1Method === "_send" || d1Method === "_sendOrThrow";
      if (typeof d1Value === "function" && isSendingMethod) {
        // ...
        return measure({
          name: "D1 Call",
          attributes: {
            "cf.binding.method": d1Method,
            "cf.binding.name": bindingName,
            "cf.binding.type": "D1Database",
          },
          onStart: (span, args) => {
            span.setAttributes({
              args: safelySerializeJSON(args),
            });
          },
          // TODO - Use this callback to add additional attributes to the span regarding the response...
          //        But the thing is, the result could be so wildly different depending on the method!
          //        Might be good to proxy each binding individually, eventually?
          //
          // onSuccess: (span, result) => {},
          onError: (span, error) => {
            const serializableError =
              error instanceof Error ? errorToJson(error) : error;
            const errorAttributes = {
              "cf.binding.error": safelySerializeJSON(serializableError),
            };
            span.setAttributes(errorAttributes);
          },
        }, d1Value.bind(d1Target));
      }

      return d1Value;
    },
  });

  markAsProxied(d1Proxy);

  return d1Proxy;
}