import {
	integer,
	pgEnum,
	pgTable,
	serial,
  jsonb,
	timestamp,
	text,
} from "drizzle-orm/pg-core";

// declaring enum in database
export const levelEnum = pgEnum("level", [
	"error",
	"warning",
	"info",
]);

export const mizuLogs = pgTable("mizu_logs", {
	id: serial("id").primaryKey(),
	level: levelEnum("level"),
	timestamp: timestamp("timestamp"),
	traceId: text("trace_id"),
	service: text("service"),
  message: jsonb("message"),
	args: jsonb("args"), // NOTE - Should only be present iff message is a string
	callerLocation: jsonb("caller_location"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type
