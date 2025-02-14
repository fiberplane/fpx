import type { OtelSpan } from "@fiberplane/fpx-types";
import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
};

export const appRoutes = sqliteTable("app_routes", {
  id: integer("id", { mode: "number" }).primaryKey(),
  path: text("path", { mode: "text" }),
  method: text("method", { mode: "text" }),
  // The text of the function serving the request
  handler: text("handler", { mode: "text" }),
  // In practice, handler_type is either "route" or "middleware" - I didn't feel like defining an enum
  handlerType: text("handler_type", { mode: "text" }),
  // A flag that indicates if this route is currently registered or the result of an old probe
  currentlyRegistered: integer("currentlyRegistered", {
    mode: "boolean",
  }).default(false),
  registrationOrder: integer("registration_order", {
    mode: "number",
  }).default(-1),
  // A flag for route type that indicated if the route was added manually by user or by probe
  routeOrigin: text("route_origin", {
    mode: "text",
    enum: ["discovered", "custom", "open_api"],
  }).default("discovered"),
  // serialized OpenAPI spec for AI prompting
  openApiSpec: text("openapi_spec", { mode: "text" }),
  requestType: text("request_type", {
    mode: "text",
    enum: ["http", "websocket"],
  }).default("http"),
});

export const appRoutesSelectSchema = createSelectSchema(appRoutes);
export const appRoutesInsertSchema = createInsertSchema(appRoutes);

export type AppRoute = z.infer<typeof appRoutesSelectSchema>;
export type NewAppRoute = z.infer<typeof appRoutesInsertSchema>;

export const appRequests = sqliteTable("app_requests", {
  id: integer("id", { mode: "number" }).primaryKey(),
  requestMethod: text("request_method", {
    mode: "text",
    enum: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "HEAD",
      "OPTIONS",
      "CONNECT",
      "TRACE",
    ],
  }).notNull(),
  requestUrl: text("request_url", { mode: "text" }).notNull(),
  requestHeaders: text("request_headers", { mode: "json" }).$type<
    Record<string, string>
  >(),
  requestQueryParams: text("request_query_params", { mode: "json" }),
  requestPathParams: text("request_path_params", { mode: "json" }),
  requestBody: text("request_body", { mode: "json" }),
  // The hono route corresponding to this request
  requestRoute: text("request_route"),
  ...timestamps,
  // responseId: integer("response_id").references(() => appResponses.id),
});

export const appResponses = sqliteTable("app_responses", {
  id: integer("id", { mode: "number" }).primaryKey(),
  traceId: text("trace_id", { mode: "text" }).notNull(),
  responseStatusCode: integer("response_status_code", { mode: "number" }),
  responseTime: integer("response_time", { mode: "number" }),
  responseHeaders: text("response_headers", { mode: "json" }).$type<{
    [key: string]: string;
  }>(),
  responseBody: text("response_body", { mode: "text" }),
  failureReason: text("failure_reason"),
  failureDetails: text("failure_details", { mode: "json" }).$type<{
    [key: string]: string;
  }>(),
  isFailure: integer("is_failure", { mode: "boolean" }).default(false),
  requestId: integer("request_id").references(() => appRequests.id),
  ...timestamps,
});

export const appResponseRelations = relations(appResponses, ({ one }) => ({
  requestId: one(appRequests, {
    fields: [appResponses.requestId],
    references: [appRequests.id],
  }),
}));

const JsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonSchema),
    z.record(JsonSchema),
  ]),
);

// TODO: probably could be reworked but this is stub anyway so who cares
const refineRequestObjects = {
  requestQueryParams: z.record(z.string()).optional(),
  requestBody: JsonSchema.optional(),
  requestHeaders: z.record(z.string()).optional(),
};

export const appRequestSelectSchema = createSelectSchema(
  appRequests,
  refineRequestObjects,
);
export const appRequestInsertSchema = createInsertSchema(
  appRequests,
  refineRequestObjects,
);

export type AppRequest = z.infer<typeof appRequestSelectSchema>;
export type NewAppRequest = z.infer<typeof appRequestInsertSchema>;

export const appResponseSelectSchema = createSelectSchema(appResponses);
export const appResponseInsertSchema = createInsertSchema(appResponses);

export type AppResponse = z.infer<typeof appResponseSelectSchema>;
export type NewAppResponse = z.infer<typeof appResponseInsertSchema>;

export const otelSpans = sqliteTable("otel_spans", {
  inner: text("inner", { mode: "json" }).$type<OtelSpan>().notNull(),
  spanId: text("span_id").notNull(),
  traceId: text("trace_id").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

// New schema for tokens
export const tokens = sqliteTable("tokens", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  value: text("value").notNull().unique(),
  expiresAt: text("expires_at"),
  ...timestamps,
});

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;

// New schema for logs of ai requests
export const aiRequestLogs = sqliteTable("ai_request_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  log: text("log", { mode: "json" }).notNull(),
  createdAt: timestamps.createdAt,
});

export const collections = sqliteTable("collections", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  ...timestamps,
});

export const newCollectionSchema = createInsertSchema(collections);
export const selectCollectionSchema = createSelectSchema(collections);

export type Collection = z.infer<typeof selectCollectionSchema>;
export type NewCollection = z.infer<typeof newCollectionSchema>;

// Define the app route -> collection relationship and store parameters
export const collectionItems = sqliteTable("collection_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  collectionId: integer("collection_id")
    .references(() => collections.id, {
      onDelete: "cascade",
    })
    .notNull(),
  appRouteId: integer("app_route_id")
    .references(() => appRoutes.id, {
      onDelete: "cascade",
    })
    .notNull(),
  requestHeaders: text("request_headers", { mode: "json" }).$type<
    Record<string, string>
  >(),
  requestQueryParams: text("request_query_params", { mode: "json" }),
  requestPathParams: text("request_path_params", { mode: "json" }),
  requestBody: text("request_body", { mode: "json" }),
  name: text("name"),
  position: integer("position").notNull(),
});

export const appRoutesRelations = relations(appRoutes, ({ many }) => ({
  collectionItems: many(collectionItems),
}));

export const collectionRelations = relations(collections, ({ many }) => ({
  collectionItems: many(collectionItems),
}));

export const collectionItemsRelations = relations(
  collectionItems,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionItems.collectionId],
      references: [collections.id],
    }),
    appRoute: one(appRoutes, {
      fields: [collectionItems.appRouteId],
      references: [appRoutes.id],
    }),
  }),
);
