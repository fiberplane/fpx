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
import { Hono } from "hono";
import { z } from "zod";
import type { Bindings, Variables } from "../lib/types.js";

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
    const response = await fetch(finalUrl, requestObject);
    const endTime = Date.now();

    // We extract the header from the response and delete it so it doesn't duplicate
    const traceId = response.headers.get("x-fpx-trace-id");

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
            responseTime: endTime - startTime,
          };
        })
        .parseAsync(response);

    await db.insert(appResponses).values([
      {
        responseStatusCode,
        responseTime,
        responseHeaders,
        responseBody,
        traceId: traceId ?? "",
        requestId,
      },
    ]);

    return ctx.json({
      responseStatusCode,
      responseTime,
      responseHeaders,
      responseBody,
      traceId: traceId ?? "",
    });
  },
);

function resolveUrl(url: string, queryParams?: Record<string, string> | null) {
  if (!queryParams) return url;

  const urlObject = new URL(url);
  for (const [key, value] of Object.entries(queryParams)) {
    urlObject.searchParams.set(key, value);
  }
  return urlObject.toString();
}

export default app;
