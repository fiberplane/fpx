import {
	integer,
	pgEnum,
	pgTable,
	serial,
  jsonb,
	timestamp,
} from "drizzle-orm/pg-core";

// declaring enum in database
export const severityEnum = pgEnum("severity", [
	"error",
	"warning",
	"info",
]);

export const mizuLogs = pgTable("mizu_logs", {
	id: serial("id").primaryKey(),
	severity: severityEnum("severity"),
  message: jsonb("message"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type
