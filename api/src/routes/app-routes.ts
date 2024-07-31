import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import {
  type NewAppRequest,
  appRequestInsertSchema,
  appRequests,
  appResponseInsertSchema,
  appResponses,
  appRoutes,
  appRoutesInsertSchema,
} from "../db/schema.js";
import type * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";
import { errorToJson, generateUUID, safeParseJson } from "../lib/utils.js";
import logger from "../logger.js";
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

app.post(
  "/v0/app-routes",
  zValidator(
    "json",
    z.union([appRoutesInsertSchema, z.array(appRoutesInsertSchema)]),
  ),
  async (ctx) => {
    const db = ctx.get("db");
    const submitted = ctx.req.valid("json");
    // NOTE: drizzle should handle this for us, but it doesn't seem to be working...
    if (Array.isArray(submitted)) {
      const createdRoutes = await db
        .insert(appRoutes)
        .values(submitted)
        .returning();
      return ctx.json(createdRoutes);
    }

    const createdRoute = await db
      .insert(appRoutes)
      .values(submitted)
      .returning();
    return ctx.json(createdRoute?.[0]);
  },
);

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
    .rightJoin(appRequests, eq(appResponses.requestId, appRequests.id))
    .limit(1000);
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

    const contentType = Object.entries(requestHeaders ?? {}).find(
      ([key, _value]) => key.toLowerCase() === "content-type",
    )?.[1];
    const contentTypeIsFormData = contentType?.includes(
      "application/x-www-form-urlencoded",
    );
    const contentTypeIsJson = contentType?.includes("application/json");

    // HACK - Just getting urlencoded form data working for now
    const body = contentTypeIsFormData
      ? createUrlEncodedBody(requestBody as Record<string, string>) // TYPE HACK
      : contentTypeIsJson
        ? JSON.stringify(requestBody)
        : (requestBody as string | undefined);

    const requestObject = {
      method: requestMethod,
      body,
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

// NOTE - This is for urlencoded (not multipart)
function createUrlEncodedBody(body: Record<string, string>) {
  return new URLSearchParams(body).toString();
}

/**
 * This route is used to proxy requests to the service we're calling.
 * It's used to add the trace-id header to the request, and to handle the response.
 *
 * As of writing it actually tries to proxy the entire response, but this might be harder
 * to do properly than just, e.g., returning the traceId.
 *
 * The reason it'd be nice to do this, however, is to support responses that include binary data.
 * Or maybe even streams eventually?
 */
app.all("/v0/proxy-request/*", async (ctx) => {
  const traceId = ctx.req.header("x-fpx-trace-id") ?? generateUUID();
  const db = ctx.get("db");

  const requestRoute = ctx.req.header("x-fpx-route");
  const requestPathParams = safeParseJson(ctx.req.header("x-fpx-path-params"));

  const requestMethod = ctx.req.method;
  const requestUrlHeader = ctx.req.header("x-fpx-proxy-to") ?? "";
  const requestHeaders: Record<string, string> = {};

  // If the header is in this list, we don't want to pass it through to the service
  const ignoreTheseHeaders = [
    "x-fpx-route",
    "x-fpx-path-params",
    "x-fpx-proxy-to",
  ];
  ctx.req.raw.headers.forEach((value, key) => {
    if (ignoreTheseHeaders.includes(key.toLowerCase())) {
      return;
    }
    requestHeaders[key] = value;
  });
  // Ensure the trace id is present
  if (!requestHeaders["x-fpx-trace-id"]) {
    requestHeaders["x-fpx-trace-id"] = traceId;
  }

  // Construct the url we want to proxy to
  const requestQueryParams = {
    ...ctx.req.query(),
  };
  const requestUrl = resolveUrl(requestUrlHeader, requestQueryParams);

  // Create a new request object
  // Clone the incoming request, so we can make a proxy Request object
  const clonedReq = ctx.req.raw.clone();
  const proxiedReq = new Request(requestUrl, {
    method: requestMethod,
    headers: new Headers(requestHeaders),
    body: clonedReq.body ? clonedReq.body.tee()[0] : null,
  });

  // Extract the request body based on content type
  // *The whole point of this is to serialize the request body into the database, for future reference*
  //
  // biome-ignore lint/suspicious/noExplicitAny: fix later
  let requestBody: any;
  const contentType = ctx.req.header("content-type");
  if (requestMethod === "GET" || requestMethod === "HEAD") {
    requestBody = undefined;
  } else if (contentType?.includes("application/json")) {
    if (ctx.req.raw.body) {
      const textBody = await ctx.req.text();
      requestBody = safeParseJson(textBody);
    } else {
      requestBody = undefined;
    }
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    requestBody = await ctx.req.formData();
  } else if (contentType?.includes("multipart/form-data")) {
    // TODO - Test me
    // NOTE - `File` will just show up as an empty object in sqllite - could be nice to record metadata?
    //         like the name of the file
    const formData = await ctx.req.parseBody({ all: true });
    requestBody = formData;
  } else {
    requestBody = await ctx.req.text();
  }

  // Record request details
  const newRequest: NewAppRequest = {
    // @ts-expect-error - Trust me, the request method is correct
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

  const requestId = insertResult[0].requestId;

  const startTime = Date.now();
  try {
    // Proxy the request
    const response = await fetch(proxiedReq);

    // Clone the response and prepare to return it
    const clonedResponse = response.clone();
    const newHeaders = new Headers(clonedResponse.headers);

    // HACK - Frontend often couldn't parse the body because of encoding mismatch
    newHeaders.delete("content-encoding");

    const proxiedResponse = new Response(clonedResponse.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });

    const duration = Date.now() - startTime;

    const { traceId: responseTraceId } = await handleSuccessfulRequest(
      db,
      requestId,
      duration,
      response,
    );

    if (responseTraceId !== traceId) {
      logger.warn(
        `Trace-id mismatch! Request: ${traceId}, Response: ${responseTraceId}`,
      );
    }

    // Guarantee the trace-id is set in response headers
    proxiedResponse.headers.set("x-fpx-trace-id", traceId);

    return proxiedResponse;
  } catch (fetchError) {
    console.log("fetchError", fetchError);
    const responseTime = Date.now() - startTime;
    const { failureDetails, failureReason, isFailure } =
      await handleFailedRequest(
        db,
        requestId,
        traceId,
        responseTime,
        fetchError,
      );

    ctx.header("x-fpx-trace-id", traceId);
    ctx.status(500);
    return ctx.json({
      isFailure,
      responseTime,
      failureDetails,
      failureReason,
      traceId,
      requestId,
    });
  }
});

app.onError((err, c) => {
  console.error("Tell me", err);
  return c.json({ message: "Internal server error" }, 500);
});

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
