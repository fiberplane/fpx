import { SpanKind } from "@opentelemetry/api";
import shimmer from "shimmer";
import { measure } from "../measure";
import {
  getRequestAttributes,
  getResponseAttributes,
  isWrapped,
} from "../utils";

const { wrap } = shimmer;

export function patchFetch() {
  // Check if the function is already patched
  // If it is, we don't want to patch it again
  if (isWrapped(globalThis.fetch)) {
    return;
  }

  wrap(globalThis, "fetch", (original) => {
    return measure(
      {
        name: "fetch",
        spanKind: SpanKind.CLIENT,
        onStart: (span, [input, init]) => {
          span.setAttributes(getRequestAttributes(input, init));
        },
        onSuccess: async (span, responsePromise) => {
          const response = await responsePromise;
          const attributeResponse = response.clone();
          const attributes = await getResponseAttributes(attributeResponse);
          span.setAttributes(attributes);
          return response;
        },
      },
      original,
    ) as typeof original;
  });
}
