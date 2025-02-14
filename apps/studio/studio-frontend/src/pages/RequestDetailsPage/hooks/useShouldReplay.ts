import {
  getRequestHeaders,
  getRequestMethod,
  getString,
  isFpxRequestSpan,
} from "@/utils";
import type { OtelTrace } from "@fiberplane/fpx-types";

export function useShouldReplay(trace: OtelTrace | null): boolean {
  if (!trace || trace?.spans?.length === 0) {
    return false;
  }

  const requestSpan = trace?.spans?.find(isFpxRequestSpan);
  if (!requestSpan) {
    return false;
  }

  const requestMethod = getRequestMethod(requestSpan);
  const requestHeaders = getRequestHeaders(requestSpan);
  const contentType = getString(
    requestHeaders["content-type"] || requestHeaders["Content-Type"],
  );

  const isReplayableMethod = ["GET", "HEAD"].includes(requestMethod);
  const isReplayableContent =
    contentType?.includes("json") || contentType?.includes("text");

  return isReplayableMethod || isReplayableContent;
}
