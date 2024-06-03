import { IGNORE_MIZU_LOGGER_LOG, errorToJson, generateUUID } from "./utils";

/**
 * In future, take inspo from:
 *
 * https://github.com/evanderkoogh/otel-cf-workers/blob/6f1c79056776024fd3e816b9e3991527e7217510/src/instrumentation/fetch.ts#L198
 */
function replaceFetch() {
  const requestId = generateUUID();
  const originalFetch = globalThis.fetch;
  // @ts-ignore
  globalThis.fetch = async (...args) => {
    const start = Date.now();
    console.log(JSON.stringify({
      lifecycle: "fetch_start",
      requestId,
      start,
      // TODO - Parse url from request args
      // TODO - Parse method from request
      // TODO - Parse body from request
      // TODO - Basically parse the whole request
      args
    }), IGNORE_MIZU_LOGGER_LOG)

    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();

      if (!clonedResponse.ok) {
        // TODO - count this as an error
      }

      const end = Date.now();
      const elapsed = end - start;
      console.log(JSON.stringify({
        lifecycle: "fetch_end",
        requestId,
        end,
        elapsed,
        // HACK - Response body
        body: await clonedResponse.text(),
      }), IGNORE_MIZU_LOGGER_LOG)
      return response;
    } catch (err) {
      console.error(JSON.stringify({
        lifecycle: "fetch_error",
        requestId,
        error: err instanceof Error ? errorToJson(err) : err,
      }), IGNORE_MIZU_LOGGER_LOG)
      throw err;
    }
  }

  return {
    undo: () => {
      globalThis.fetch = originalFetch;
    },
    originalFetch,
  }
}