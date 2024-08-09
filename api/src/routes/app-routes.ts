import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { env } from "hono/adapter";
import { z } from "zod";
import {
  type NewAppRequest,
  appRequests,
  appResponses,
  appRoutes,
  appRoutesInsertSchema,
} from "../db/schema.js";
import {
  OTEL_TRACE_ID_REGEX,
  generateOtelTraceId,
  isValidOtelTraceId,
} from "../lib/otel/index.js";
import {
  executeProxyRequest,
  handleFailedRequest,
  handleSuccessfulRequest,
} from "../lib/proxy-request/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import {
  type SerializedFile,
  isJson,
  serializeRequestBodyForFpxDb,
} from "../lib/utils.js";
import {
  fallback,
  resolveUrlQueryParams,
  resolveWebhoncUrl,
  safeParseJson,
} from "../lib/utils.js";
import { getWebHoncConnectionId } from "../lib/webhonc/store.js";
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

const schemaProbedRoutes = z.object({
  routes: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      handler: z.string(),
      handlerType: z.string(),
    }),
  ),
});

app.post(
  "/v0/probed-routes",
  zValidator("json", schemaProbedRoutes),
  async (ctx) => {
    const db = ctx.get("db");
    const { routes } = ctx.req.valid("json");

    try {
      if (routes.length > 0) {
        // "Unregister" all app routes (including middleware)
        await db.update(appRoutes).set({ currentlyRegistered: false });
        // "Re-register" all current app routes
        for (const route of routes) {
          await db
            .insert(appRoutes)
            .values({
              ...route,
              currentlyRegistered: true,
            })
            .onConflictDoUpdate({
              target: [
                appRoutes.path,
                appRoutes.method,
                appRoutes.handlerType,
                appRoutes.routeOrigin,
              ],
              set: { handler: route.handler, currentlyRegistered: true },
            });
        }

        // TODO - Detect if anything actually changed before invalidating the query on the frontend
        //        This would be more of an optimization, but is friendlier to the frontend
        const wsConnections = ctx.get("wsConnections");

        if (wsConnections) {
          for (const ws of wsConnections) {
            ws.send(
              JSON.stringify({
                event: "trace_created",
                payload: ["appRoutes"],
              }),
            );
          }
        }
      }

      return ctx.text("OK");
    } catch (err) {
      if (err instanceof Error) {
        logger.error("Error processing probed routes", err);
      }
      return ctx.json({ error: "Error processing probed routes" }, 500);
    }
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

export const ProxyRequestHeadersSchema = z.object({
  "x-fpx-trace-id": fallback(
    z.string().regex(OTEL_TRACE_ID_REGEX),
    generateOtelTraceId,
  ).describe("The otel trace id to use for the request"),
  "x-fpx-headers-json": z
    .string()
    .optional()
    .describe("The headers to use for the request, serialized as JSON"),
  "x-fpx-route": z
    .string()
    .optional()
    .describe("The Hono route pattern associated with the request"),
  "x-fpx-path-params": z
    .string()
    .optional()
    .describe("The path params to use for the request, if any"),
  "x-fpx-proxy-to": z
    .string()
    .describe(
      "The url to proxy to, this is the url we execute a request against",
    ),
});

const PROXY_HEADERS_IGNORE = [
  "x-fpx-route",
  "x-fpx-path-params",
  "x-fpx-proxy-to",
];

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
app.all(
  "/v0/proxy-request/*",
  // Validate the headers we use to record request details and proxy the request
  zValidator("header", ProxyRequestHeadersSchema),
  async (ctx) => {
    const {
      "x-fpx-trace-id": traceIdHeader,
      "x-fpx-proxy-to": proxyToHeader,
      "x-fpx-path-params": pathParamsHeader,
      "x-fpx-route": routeHeader,
      "x-fpx-headers-json": headersJsonHeader,
    } = ctx.req.valid("header");
    // Try to extract the trace id from the header, otherwise generate a new one
    const shouldUseHeaderTraceId = isValidOtelTraceId(traceIdHeader ?? "");
    const traceId: string =
      traceIdHeader && shouldUseHeaderTraceId
        ? traceIdHeader
        : generateOtelTraceId();

    if (!shouldUseHeaderTraceId) {
      logger.debug(
        `Invalid trace id in header: ${traceIdHeader}, generating new trace id: ${traceId}`,
      );
    }

    const db = ctx.get("db");

    const requestRoute = routeHeader ?? null;
    const requestPathParams = pathParamsHeader
      ? safeParseJson(pathParamsHeader)
      : null;

    const requestMethod = ctx.req.method;
    const requestUrlHeader = proxyToHeader;

    // NOTE - These are the headers that will be used in the request to the service
    //        Check this helper function out, especially if you're curious about how
    //        we ensure multipart form data is correctly handled.
    const requestHeaders: Record<string, string> =
      constructProxiedRequestHeaders(ctx, headersJsonHeader ?? "", traceId);

    // Construct the url we want to proxy to, using the query params from the original request
    const requestQueryParams = {
      ...ctx.req.query(),
    };
    const requestUrl = resolveUrlQueryParams(
      requestUrlHeader,
      requestQueryParams,
    );
    logger.debug("Proxying request to:", requestUrl);
    logger.debug("Proxying request with headers:", requestHeaders);

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
    let requestBody:
      | null
      | string
      | {
          [x: string]: string | SerializedFile | (string | SerializedFile)[];
        } = null;
    try {
      requestBody = await serializeRequestBodyForFpxDb(ctx);
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
      const response = await executeProxyRequest(proxiedReq);

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

      await handleSuccessfulRequest(db, requestId, duration, response, traceId);

      proxiedResponse.headers.set("x-fpx-trace-id", traceId);

      return proxiedResponse;
    } catch (fetchError) {
      logger.debug("Error executing proxied request (fetchError):", fetchError);
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
  },
);

app.get("/v0/webhonc", async (ctx) => {
  const connectionId = getWebHoncConnectionId();
  const baseUrl = resolveWebhoncUrl();
  const protocol = baseUrl.startsWith("localhost") ? "http" : "https";
  return ctx.json({ webhoncUrl: `${protocol}://${baseUrl}/${connectionId}` });
});

export default app;

/**
 * Constructs the headers that will be used in the request to the service,
 * allowing us to use what the user specifically set in the FPX ui, while
 * also making sure multipart form data is correctly handled.
 *
 * @param ctx
 * @param fpxRequestorUiHeaders
 * @param traceId
 * @returns
 */
function constructProxiedRequestHeaders(
  ctx: Context,
  fpxRequestorUiHeaders: string,
  traceId: string,
) {
  // NOTE - These are the headers that were set in the FPX ui itself
  const requestHeadersFromRequestorUi: Record<string, string> = isJson(
    fpxRequestorUiHeaders,
  )
    ? safeParseJson(fpxRequestorUiHeaders)
    : {};

  // NOTE - These are the headers that will be used in the request to the service
  const requestHeaders: Record<string, string> = {};

  // NOTE - We don't want to copy over the headers that were set by the browser fetch client
  //        This is because the browser fetch client sets some headers that we don't want to pass through
  //        to the service, such as the referer header, and several sec-fetch headers, etc
  //        See: FP-3930
  //
  // ctx.req.raw.headers.forEach((value, key) => {
  //   if (ignoreTheseHeaders.includes(key.toLowerCase())) {
  //     return;
  //   }
  //   requestHeaders[key] = value;
  // });

  for (const [key, value] of Object.entries(requestHeadersFromRequestorUi)) {
    // If a header is in this list, we don't want to pass it through to the service
    if (PROXY_HEADERS_IGNORE.includes(key.toLowerCase())) {
      continue;
    }
    requestHeaders[key] = value;
  }

  const alreadyHasContentType = Object.keys(requestHeaders).some(
    (key) => key.toLowerCase() === "content-type",
  );

  if (!alreadyHasContentType) {
    // NOTE - We want to pass through the content type header if it's not multipart/form-data
    //        This is because multipart/form-data has a specific form boundary that's generated by the fetch client
    //        We will let our proxied request handle the multipart/form-data content type on its own
    const rawContentType = ctx.req.raw.headers.get("content-type");
    const hasMultipartFormData = rawContentType?.includes(
      "multipart/form-data",
    );
    if (rawContentType && !hasMultipartFormData) {
      requestHeaders["Content-Type"] = rawContentType;
    }
  }

  // Ensure the trace id is present
  if (!requestHeaders["x-fpx-trace-id"]) {
    requestHeaders["x-fpx-trace-id"] = traceId;
  }

  return requestHeaders;
}
