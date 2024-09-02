import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
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
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  requestId: integer("request_id").references(() => appRequests.id),
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

// HELPFUL: https://orm.drizzle.team/docs/column-types/sqlite
export const mizuLogs = sqliteTable("mizu_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  level: text("level", { enum: ["error", "warning", "info", "debug"] }),
  timestamp: text("timestamp"),
  traceId: text("trace_id"),
  service: text("service"),
  message: text("message", { mode: "json" }),
  ignored: integer("ignored", { mode: "boolean" }).default(false),
  args: text("args", { mode: "json" }), // NOTE - Should only be present iff message is a string
  callerLocation: text("caller_location", { mode: "json" }).$type<
    z.infer<typeof CallerLocationSchema>
  >(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  matchingIssues: text("matching_issues", { mode: "json" }).$type<
    number[] | null
  >(),
});

const CallerLocationSchema = z.object({
  file: z.string(),
  line: z.string(),
  column: z.string(),
});

// TODO: Make a better schema for this
//       And add a separate schema for the raw spans from the exporter
//       Inspo: https://github.com/wperron/sqliteexporter/blob/main/migrations/20240120195122_init.up.sql
export const otelSpans = sqliteTable("otel_spans", {
  spanId: text("span_id"),
  traceId: text("trace_id"),
  parsedPayload: text("parsed_payload", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const newMizuLogSchema = createInsertSchema(mizuLogs);
export const mizuLogSchema = createSelectSchema(mizuLogs);

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type

export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
