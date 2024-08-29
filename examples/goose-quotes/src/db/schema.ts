import {
  boolean,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const geese = pgTable("geese", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isFlockLeader: boolean("is_leader"),
  programmingLanguage: text("programming_language"),
  motivations: jsonb("motivations"),
  location: text("location"),
  bio: text("bio"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
