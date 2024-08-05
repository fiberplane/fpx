import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import {
  type NewAppRequest,
  appRequests,
  appResponses,
  appRoutes,
  appRoutesInsertSchema,
} from "../db/schema/index.js";
import {
  executeProxyRequest,
  handleFailedRequest,
  handleSuccessfulRequest,
} from "../lib/proxy-request/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import { resolveUrl, safeParseJson } from "../lib/utils.js";
import logger from "../logger.js";
import { resolveServiceArg } from "../probe-routes.js";

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

type SerializedFile = {
  name: string;
  type: string;
  size: number;
};

function serializeFile(file: File): SerializedFile {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

function serializeFormDataValue(
  value: FormDataEntryValue,
): string | SerializedFile {
  if (value instanceof File) {
    return serializeFile(value);
  }
  return value;
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
  const parsedTraceId = ctx.req.header("x-fpx-trace-id") || crypto.randomUUID();
  logger.debug("Proxying request with traceId:", parsedTraceId);
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
    requestHeaders["x-fpx-trace-id"] = parsedTraceId;
  }

  // Construct the url we want to proxy to
  const requestQueryParams = {
    ...ctx.req.query(),
  };
  const requestUrl = resolveUrl(requestUrlHeader, requestQueryParams);
  logger.debug("Proxying request to:", requestUrl);
  logger.debug("Proxying request with headers:", requestHeaders);
  // Create a new request object
  // Clone the incoming request, so we can make a proxy Request object
  const clonedReq = ctx.req.raw.clone();

  // Extract the request body based on content type
  // *The whole point of this is to serialize the request body into the database, for future reference*
  //
  let requestBody:
    | null
    | string
    | {
        [x: string]: string | SerializedFile | (string | SerializedFile)[];
      } = null;
  try {
    requestBody = await serializeRequestBodyForFpxDb();
  } catch (error) {
    requestBody = "<failed to parse>";
    logger.error("Failed to serialize request body", error);
  }

  // Record request details
  const newRequest: NewAppRequest = {
    // @ts-expect-error - Trust me, the request method is correct, and it's a string
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
    newRequest.requestBody = clonedReq.body;
    const response = await executeProxyRequest(newRequest);

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

    if (responseTraceId !== parsedTraceId) {
      logger.warn(
        `Trace-id mismatch! Request: ${parsedTraceId}, Response: ${responseTraceId}`,
      );
    }

    // Guarantee the trace-id is set in response headers
    proxiedResponse.headers.set("x-fpx-trace-id", parsedTraceId);

    return proxiedResponse;
  } catch (fetchError) {
    console.log("fetchError", fetchError);
    const responseTime = Date.now() - startTime;
    const { failureDetails, failureReason, isFailure } =
      await handleFailedRequest(
        db,
        requestId,
        parsedTraceId,
        responseTime,
        fetchError,
      );

    ctx.header("x-fpx-trace-id", parsedTraceId);
    ctx.status(500);
    return ctx.json({
      isFailure,
      responseTime,
      failureDetails,
      failureReason,
      traceId: parsedTraceId,
      requestId,
    });
  }

  /**
   * Helper that serializes the request body into a format that can be stored in the database
   *
   * This will *not* store binary data, for example, like File objects
   */
  async function serializeRequestBodyForFpxDb() {
    const contentType = ctx.req.header("content-type");
    let requestBody:
      | null
      | string
      | {
          [x: string]: string | SerializedFile | (string | SerializedFile)[];
        } = null;
    if (ctx.req.raw.body) {
      if (requestMethod === "GET" || requestMethod === "HEAD") {
        logger.warn(
          "Request method is GET or HEAD, but request body is not null",
        );
        requestBody = null;
      } else if (contentType?.includes("application/json")) {
        // NOTE - This kind of handles the case where the body is note valid json,
        //        but the content type is set to application/json
        const textBody = await ctx.req.text();
        requestBody = safeParseJson(textBody);
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const formData = await ctx.req.formData();
        requestBody = {};
        // @ts-expect-error - MDN says formData does indeed have an entries method :thinking_face:
        for (const [key, value] of formData.entries()) {
          requestBody[key] = value;
        }
      } else if (contentType?.includes("multipart/form-data")) {
        // NOTE - `File` will just show up as an empty object in sqllite - could be nice to record metadata?
        //         like the name of the file
        const formData = await ctx.req.parseBody({ all: true });
        requestBody = {};
        for (const [key, value] of Object.entries(formData)) {
          if (Array.isArray(value)) {
            requestBody[key] = value.map(serializeFormDataValue);
          } else {
            requestBody[key] = serializeFormDataValue(value);
          }
        }
      } else if (contentType?.includes("application/octet-stream")) {
        requestBody = "<binary data>";
      } else {
        requestBody = await ctx.req.text();
      }
    }

    return requestBody;
  }
});

export default app;
