import {
  type Settings,
  type SettingsKey,
  SettingsSchema,
} from "@fiberplane/fpx-types";
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { settings } from "../../db/schema.js";
import type * as schema from "../../db/schema.js";

export async function upsertSettings(
  db: LibSQLDatabase<typeof schema>,
  content: Settings,
) {
  const parsedSettings = SettingsSchema.parse(content);

  const rows = Object.entries(parsedSettings).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
  }));

  return await db
    .insert(settings)
    .values(rows)
    .onConflictDoUpdate({
      target: [settings.key],
      set: { value: sql`excluded.value` },
    })
    .returning();
}

export async function upsertSettingsOld(
  db: LibSQLDatabase<typeof schema>,
  content: Settings,
) {
  const settingsToUpdate = Object.entries(content)
    .filter(([_, value]) => Boolean(value))
    .map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
    }));

  return await db
    .insert(settings)
    .values(settingsToUpdate)
    .onConflictDoUpdate({
      target: [settings.key],
      set: { value: sql`excluded.value` },
    })
    .returning();
}

export async function getSetting<T extends SettingsKey>(
  db: LibSQLDatabase<typeof schema>,
  key: T,
): Promise<Settings[T] | undefined> {
  const result = await db.query.settings.findFirst({ where: eq(settings.key, String(key)) });

  if (!result?.value) {
    return;
  }

  return JSON.parse(result.value);
}

export async function getAllSettings(
  db: LibSQLDatabase<typeof schema>,
): Promise<Settings> {
  const results = await db.query.settings.findMany();

  const mappedToSchema = results.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.key] = setting.value ? JSON.parse(setting.value) : undefined;
    return acc;
  }, {});

  return SettingsSchema.parse(mappedToSchema);
}

export async function getInferenceConfig(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await getAllSettings(db);

  if (Object.keys(settingsRecords).length > 0) {
    const { success, data: settings } =
      SettingsSchema.safeParse(settingsRecords);

    if (success) {
      return settings;
    }
  }

  return;
}
