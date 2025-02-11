// import type { Context } from "hono"
import { SSEStreamingApi } from "hono/streaming";

const run = async (
  stream: SSEStreamingApi,
  cb: (stream: SSEStreamingApi) => Promise<void>,
  onError?: (e: Error, stream: SSEStreamingApi) => Promise<void>,
): Promise<void> => {
  try {
    await cb(stream);
  } catch (e) {
    if (e instanceof Error && onError) {
      await onError(e, stream);

      await stream.writeSSE({
        event: "error",
        data: e.message,
      });
    } else {
      // TODO - Replace with our logger
      console.error(e);
    }
  } finally {
    stream.close();
  }
};

/**
 * Modified version of `hono/streaming/sse` that we can use from a durable object.
 *
 * In
 */
export const modifiedStreamSSE = (
  request: Request,
  cb: (stream: SSEStreamingApi) => Promise<void>,
  onError?: (e: Error, stream: SSEStreamingApi) => Promise<void>,
): Response => {
  const { readable, writable } = new TransformStream();
  const stream = new SSEStreamingApi(writable, readable);

  // bun does not cancel response stream when request is canceled, so detect abort by signal
  request.signal.addEventListener("abort", () => {
    if (!stream.closed) {
      stream.abort();
    }
  });
  // // in bun, `c` is destroyed when the request is returned, so hold it until the end of streaming
  // contextStash.set(stream.responseReadable, c)

  run(stream, cb, onError);

  return new Response(stream.responseReadable, {
    headers: {
      "Transfer-Encoding": "chunked",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
