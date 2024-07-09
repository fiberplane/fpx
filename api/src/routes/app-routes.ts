import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { env } from "hono/adapter";
import logger from "src/logger.js";
import { z } from "zod";
import {
  type NewAppRequest,
  appRequestInsertSchema,
  appRequests,
  appResponseInsertSchema,
  appResponses,
  appRoutes,
} from "../db/schema.js";
import type * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";
import { errorToJson, generateUUID } from "../lib/utils.js";
import { resolveServiceArg } from "../probe-routes.js";

type RequestIdType = schema.AppResponse["requestId"];
type DbType = LibSQLDatabase<typeof schema>;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v0/app-routes", async (ctx) => {
  const db = ctx.get("db");
  const routes = await db.select().from(appRoutes);
  const baseUrl = resolveServiceArg(
    env(ctx).FPX_SERVICE_TARGET as string,
    "http://localhost:8787",
  );
  return ctx.json({
    baseUrl,
    routes,
  });
});

app.post("/v0/app-routes", async (ctx) => {
  const db = ctx.get("db");
  const { path, method } = await ctx.req.json();
  // TODO - Handle `SQLITE_CONSTRAINT_PRIMARYKEY` error
  const createdRoute = await db
    .insert(appRoutes)
    .values({
      path,
      method,
      handlerType: "route",
      // TODO
      handler: "CODE NOT AVAILABLE",
      addedByUser: true,
    })
    .returning();
  return ctx.json(createdRoute?.[0]);
});

app.delete("/v0/app-routes/:method/:path", async (ctx) => {
  const db = ctx.get("db");
  const { method, path } = ctx.req.param();
  const decodedPath = decodeURIComponent(path);
  const createdRoute = await db
    .delete(appRoutes)
    .where(
      and(
        eq(appRoutes.method, method),
        eq(appRoutes.path, decodedPath),
        eq(appRoutes.handlerType, "route"),
        // Only allow deleting routes that were NOT auto-detected
        eq(appRoutes.currentlyRegistered, false),
      ),
    )
    .returning();
  return ctx.json(createdRoute?.[0]);
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
    const traceId = ctx.req.header("x-fpx-trace-id") ?? generateUUID();

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

    // NOTE - We want to pass the trace-id through to the service we're calling
    //        This helps us optionally correlate requests more easily in the frontend
    const modifiedRequestHeaders = {
      ...(requestHeaders ?? {}),
      "x-fpx-trace-id": traceId,
    };

    const requestObject = {
      method: requestMethod,
      body:
        (requestBody ? JSON.stringify(requestBody) : requestBody) ??
        // biome-ignore lint/suspicious/noExplicitAny: just make it work
        (undefined as any),
      headers: modifiedRequestHeaders,
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
        traceId: responseTraceId,
        isFailure,
      } = await handleSuccessfulRequest(db, requestId, duration, response);

      if (responseTraceId !== traceId) {
        logger.warn(
          `Trace-id mismatch! Request: ${traceId}, Response: ${responseTraceId}`,
        );
      }

      return ctx.json({
        responseStatusCode,
        responseTime,
        responseHeaders,
        responseBody,
        isFailure,
        traceId: responseTraceId,
        requestId,
      });
    } catch (fetchError) {
      // NOTE - This will happen when the service is unreachable.
      //        Could be good to parse the error for more information!
      const responseTime = Date.now() - startTime;
      const { failureDetails, failureReason, isFailure } =
        await handleFailedRequest(
          db,
          requestId,
          traceId,
          responseTime,
          fetchError,
        );

      return ctx.json({
        isFailure,
        responseTime,
        failureDetails,
        failureReason,
        traceId,
        requestId,
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

function safeReadTextBody(response: Response) {
  return response.text().catch((error) => {
    logger.error("Failed to parse response body", error);
    return null;
  });
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
 * Extract useful data from the error when a request fails,
 * and save that data in the `app_responses` table
 */
async function handleFailedRequest(
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

function resolveUrl(url: string, queryParams?: Record<string, string> | null) {
  if (!queryParams) return url;

  const urlObject = new URL(url);
  for (const [key, value] of Object.entries(queryParams)) {
    urlObject.searchParams.set(key, value);
  }
  return urlObject.toString();
}

export default app;
