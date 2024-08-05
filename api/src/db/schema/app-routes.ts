import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const appRoutes = sqliteTable(
  "app_routes",
  {
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
  },
  (table) => {
    return {
      id: primaryKey({
        name: "id",
        columns: [
          table.method,
          table.path,
          table.handlerType,
          table.routeOrigin,
        ],
      }),
    };
  },
);

export const appRoutesSelectSchema = createSelectSchema(appRoutes);
export const appRoutesInsertSchema = createInsertSchema(appRoutes);

export type AppRoute = z.infer<typeof appRoutesSelectSchema>;
export type NewAppRoute = z.infer<typeof appRoutesInsertSchema>;
