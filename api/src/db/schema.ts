import {
	integer,
	pgEnum,
	pgTable,
	serial,
	uniqueIndex,
	varchar,
  jsonb,
} from "drizzle-orm/pg-core";

// declaring enum in database
export const popularityEnum = pgEnum("severity", [
	"error",
	"warning",
	"info",
]);

// export const countries = pgTable(
// 	"countries",
// 	{
// 		id: serial("id").primaryKey(),
// 		name: varchar("name", { length: 256 }),
// 	},
// 	(countries) => {
// 		return {
// 			nameIndex: uniqueIndex("name_idx").on(countries.name),
// 		};
// 	},
// );

export const mizuLogs = pgTable("mizu_logs", {
	id: serial("id").primaryKey(),
	// name: varchar("name", { length: 256 }),
	// countryId: integer("country_id").references(() => countries.id),
	severity: popularityEnum("severity"),
  message: jsonb("message"),
});