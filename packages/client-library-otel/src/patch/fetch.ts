import { SpanKind } from "@opentelemetry/api";
import { wrap } from "shimmer";
import { measure } from "../measure.js";
import {
  getRequestAttributes,
  getResponseAttributes,
  isWrapped,
} from "../utils/index.js";

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
        onSuccess: async (span, response) => {
          const attributes = await getResponseAttributes(
            (await response).clone(),
          );
          span.setAttributes(attributes);
        },
      },
      original,
    ) as typeof original;
  });
}
