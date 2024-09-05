import type { LibSQLDatabase } from "drizzle-orm/libsql";
import {
  type NewAppRequest,
  appResponseInsertSchema,
  appResponses,
} from "../../db/schema.js";
import logger from "../../logger.js";

import { z } from "zod";
import type * as schema from "../../db/schema.js";
import { errorToJson, safeReadTextBody } from "../utils.js";

type RequestIdType = schema.AppResponse["requestId"];
type DbType = LibSQLDatabase<typeof schema>;

/**
 * This function executes a proxy request and returns the response or *throws* an error.
 */
export async function executeProxyRequest(
  reqOrAppReq: NewAppRequest | Request,
) {
  const proxiedReq =
    reqOrAppReq instanceof Request
      ? reqOrAppReq
      : createProxyRequestFromNewAppRequest(reqOrAppReq);

  try {
    const response = await fetch(proxiedReq);
    return response;
  } catch (err) {
    logger.error("executeProxyRequest fetchError:", err);
    throw err;
  }
}

function createProxyRequestFromNewAppRequest(
  requestDescription: NewAppRequest,
) {
  const { requestUrl, requestMethod, requestBody } = requestDescription;

  let { requestHeaders } = requestDescription;

  if (!requestHeaders) {
    requestHeaders = {};
  }

  let validBody: BodyInit | null = null;
  if (requestBody != null) {
    if (
      requestBody instanceof Blob ||
      requestBody instanceof ArrayBuffer ||
      requestBody instanceof FormData ||
      requestBody instanceof URLSearchParams ||
      requestBody instanceof ReadableStream ||
      typeof requestBody === "string"
    ) {
      validBody = requestBody;
    } else if (requestBody && typeof requestBody === "object") {
      logger.debug(
        "executeProxyRequest requestBody is an object, stringifying it",
      );
      validBody = JSON.stringify(requestBody);
    } else {
      logger.warn("Invalid requestBody type. Setting to null.");
    }
  }

  const proxiedReq = new Request(requestUrl, {
    method: requestMethod,
    headers: new Headers(requestHeaders),
    body: validBody,
  });

  return proxiedReq;
}

/**
 * Extract useful data from the error when a request fails,
 * and save that data in the `app_responses` table
 */
export async function handleFailedRequest(
  db: DbType,
  requestId: RequestIdType,
  traceId: string,
  responseTime: number,
  error: unknown,
) {
  let failureReason = "unknown";
  if (hasMessage(error)) {
    failureReason = error.message;
  }
  let failureDetails: Record<string, string> = {};
  if (error instanceof Error) {
    failureDetails = errorToJson(error);
  }

  await db.insert(appResponses).values([
    {
      isFailure: true,
      responseTime,
      traceId,
      requestId,
      failureReason,
      failureDetails,
    },
  ]);

  return {
    isFailure: true,
    responseTime,
    traceId,
    requestId,
    failureReason,
    failureDetails,
  };
}

function hasMessage(error: unknown): error is { message: string } {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error?.message === "string"
  );
}

/**
 * Extract useful data from the response when a request succeeds,
 * and save that data in the `app_responses` table
 */
export async function handleSuccessfulRequest(
  db: DbType,
  requestId: RequestIdType,
  duration: number,
  response: Awaited<ReturnType<typeof fetch>>,
  traceId: string,
) {
  const { responseBody, responseTime, responseHeaders, responseStatusCode } =
    await appResponseInsertSchema
      .extend({
        headers: z.instanceof(Headers),
        status: z.number(),
        body: z.instanceof(ReadableStream).nullable(),
        traceId: z.string().optional(),
      })
      .transform(async ({ headers, status }) => {
        const responseHeaders: Record<string, string> = {};
        // NOTE - Order of arguments when you do `forEach` on a Headers object is (headerValue, headerName)
        headers.forEach((headerValue, headerName) => {
          responseHeaders[headerName] = headerValue;
        });

        return {
          responseHeaders,
          responseStatusCode: status,
          responseBody: await safeReadTextBody(response),
          responseTime: duration,
        };
      })
      .parseAsync(response);

  await db.insert(appResponses).values([
    {
      isFailure: false,
      responseStatusCode,
      responseTime,
      responseHeaders,
      responseBody,
      traceId,
      requestId,
    },
  ]);

  return {
    isFailure: false,
    responseStatusCode,
    responseTime,
    responseHeaders,
    responseBody,
    traceId,
  };
}
