import { IGNORE_MIZU_LOGGER_LOG, errorToJson, generateUUID } from "./utils";

/**
 * In future, take inspo from:
 *
 * https://github.com/evanderkoogh/otel-cf-workers/blob/6f1c79056776024fd3e816b9e3991527e7217510/src/instrumentation/fetch.ts#L198
 */
export function replaceFetch() {
  const requestId = generateUUID();
  const originalFetch = globalThis.fetch;

  // @ts-ignore
  globalThis.fetch = async (...args) => {
    const start = Date.now();
    const [resource, init] = args;
    const method = init?.method || "GET";
    const url =
      typeof resource === "string"
        ? resource
        : resource instanceof URL
          ? resource.toString()
          : resource.url;
    const body = init?.body ? await new Response(init.body).text() : null;

    console.log(
      JSON.stringify({
        lifecycle: "fetch_start",
        requestId,
        start,
        url, // Parsed URL
        method, // Parsed method
        body, // Parsed body
        args, // Full request args
      }),
      IGNORE_MIZU_LOGGER_LOG,
    );

    try {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();

      if (!clonedResponse.ok) {
        // @ts-ignore: weird type conflict
        const body: string | null = await tryBody(clonedResponse);
        // Count this as an error
        console.error(
          JSON.stringify({
            lifecycle: "fetch_error",
            requestId,
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            body,
            url,
          }),
          IGNORE_MIZU_LOGGER_LOG,
        );
      }

      // @ts-ignore: weird type conflict
      const body: string | null = await tryBody(clonedResponse);

      // Extract and format response headers
      const headers: { [key: string]: string } = {};
      clonedResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const end = Date.now();
      const elapsed = end - start;
      console.log(
        JSON.stringify({
          lifecycle: "fetch_end",
          requestId,
          end,
          elapsed,
          url,
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers,
          body,
        }),
        IGNORE_MIZU_LOGGER_LOG,
      );

      return response;
    } catch (err) {
      console.error(
        JSON.stringify({
          lifecycle: "fetch_logging_error",
          requestId,
          error: err instanceof Error ? errorToJson(err) : err,
        }),
        IGNORE_MIZU_LOGGER_LOG,
      );
      throw err;
    }
  };

  return {
    undo: () => {
      globalThis.fetch = originalFetch;
    },
    originalFetch,
  };
}

async function tryBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return null;
  }
}
