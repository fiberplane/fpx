import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// TODO - Figure out how to use drizzle with "@hono/zod-openapi"
//
export const UserSchema = createSelectSchema(users);
export const NewUserSchema = createInsertSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
