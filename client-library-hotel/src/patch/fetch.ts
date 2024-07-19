import { trace } from "@opentelemetry/api";
import { wrap } from "shimmer";
import { measure } from "../measure";
import type { InitParam, InputParam } from "../types";
import { getRequestAttributes, getResponseAttributes } from "../utils";

export function patchFetch() {
  wrap(globalThis, "fetch", (original) => {
    async function customFetch(
      // Funky type definition to please the typescript
      // lord
      input: InputParam,
      init: InitParam,
    ) {
      const span = trace.getActiveSpan();

      if (span) {
        span.setAttributes(getRequestAttributes(input, init));
      }

      const response = await original(input, init);
      if (span) {
        const clonedResponse = response.clone();
        const attributes = await getResponseAttributes(clonedResponse);
        span.setAttributes(attributes);
      }

      return response;
    }

    return measure("fetch", customFetch) as typeof original;
  });
}
