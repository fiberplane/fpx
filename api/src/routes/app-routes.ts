import {
  type NewAppRequest,
  appRequestInsertSchema,
  appRequests,
  appResponseInsertSchema,
  appResponses,
  appRoutes,
} from "@/db/schema.js";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { z } from "zod";
import type * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";

type RequestIdType = schema.AppResponse["requestId"];
type DbType = LibSQLDatabase<typeof schema>;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v0/app-routes", async (ctx) => {
  const db = ctx.get("db");
  const routes = await db.select().from(appRoutes);
  return ctx.json(routes);
});

app.get("/v0/all-requests", async (ctx) => {
  const db = ctx.get("db");
  const requests = await db
    .select()
    .from(appResponses)
    .rightJoin(appRequests, eq(appResponses.requestId, appRequests.id));
  return ctx.json(requests);
});

app.post(
  "/v0/send-request",
  zValidator("json", appRequestInsertSchema),
  async (ctx) => {
    const {
      requestMethod,
      requestUrl,
      requestHeaders,
      requestQueryParams,
      requestPathParams,
      requestBody,
      requestRoute,
    } = ctx.req.valid("json");

    const db = ctx.get("db");

    const requestObject = {
      method: requestMethod,
      body:
        (requestBody ? JSON.stringify(requestBody) : requestBody) ??
        // biome-ignore lint/suspicious/noExplicitAny: just make it work
        (undefined as any),
      headers: requestHeaders ?? undefined,
    };

    const finalUrl = resolveUrl(requestUrl, requestQueryParams);

    const newRequest: NewAppRequest = {
      requestMethod,
      requestUrl,
      requestHeaders,
      requestPathParams,
      requestQueryParams,
      requestBody,
      requestRoute,
    };

    const insertResult = await db
      .insert(appRequests)
      .values(newRequest)
      .returning({ requestId: appRequests.id });

    const requestId = insertResult[0].requestId; // only one insert always happens not sure why drizzle returns an array...

    const startTime = Date.now();
    try {
      const response = await fetch(finalUrl, requestObject);
      const duration = Date.now() - startTime;

      const {
        responseStatusCode,
        responseTime,
        responseHeaders,
        responseBody,
        traceId,
        isFailure,
      } = await handleSuccessfulRequest(db, requestId, duration, response);

      return ctx.json({
        responseStatusCode,
        responseTime,
        responseHeaders,
        responseBody,
        isFailure,
        traceId,
      });
    } catch (fetchError) {
      // NOTE - This will happen when the service is unreachable.
      //        Could be good to parse the error for more information!
      const responseTime = Date.now() - startTime;
      const { failureDetails, failureReason, traceId, isFailure } =
        await handleFailedRequest(db, requestId, responseTime, fetchError);

      return ctx.json({
        isFailure,
        responseTime,
        failureDetails,
        failureReason,
        traceId,
      });
    }
  },
);

/**
 * Extract useful data from the response when a request succeeds,
 * and save that data in the `app_responses` table
 */
async function handleSuccessfulRequest(
  db: DbType,
  requestId: RequestIdType,
  duration: number,
  response: Awaited<ReturnType<typeof fetch>>,
) {
  const traceId = response.headers.get("x-fpx-trace-id") ?? "";

  const { responseBody, responseTime, responseHeaders, responseStatusCode } =
    await appResponseInsertSchema
      .extend({
        headers: z.instanceof(Headers),
        status: z.number(),
        body: z.instanceof(ReadableStream),
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
          responseBody: await response.text(),
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

function hasMessage(error: unknown): error is { message: string } {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error?.message === "string"
  );
}
export function errorToJson(error: Error) {
  return {
    name: error.name, // Includes the name of the error, e.g., 'TypeError'
    message: error.message, // The message string of the error
    stack: error.stack ?? "", // Stack trace of where the error occurred (useful for debugging)
    // Optionally add more properties here if needed
  };
}

/**
 * Extract useful data from the error when a request fails,
 * and save that data in the `app_responses` table
 */
async function handleFailedRequest(
  db: DbType,
  requestId: RequestIdType,
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
  const traceId = "";

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

function resolveUrl(url: string, queryParams?: Record<string, string> | null) {
  if (!queryParams) return url;

  const urlObject = new URL(url);
  for (const [key, value] of Object.entries(queryParams)) {
    urlObject.searchParams.set(key, value);
  }
  return urlObject.toString();
}

export default app;
