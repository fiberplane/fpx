import {
  type SettingsForm,
  SettingsFormSchema,
  type SettingsKey,
} from "@fiberplane/fpx-types";
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { settings } from "../../db/schema.js";
import type * as schema from "../../db/schema.js";

export async function upsertSettings(
  db: LibSQLDatabase<typeof schema>,
  content: SettingsForm,
) {
  const parsedSettings = SettingsFormSchema.parse(content);

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
  content: SettingsForm,
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
): Promise<SettingsForm[T] | undefined> {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, String(key)))
    .limit(1);

  if (!setting) {
    return;
  }

  return JSON.parse(setting.value);
}

export async function getAllSettings(
  db: LibSQLDatabase<typeof schema>,
): Promise<SettingsForm> {
  const settings = await db.query.settings.findMany();

  const mapped = settings.reduce<Record<string, string>>((acc, setting) => {
    acc[setting.key] = JSON.parse(setting.value);
    return acc;
  }, {});

  return SettingsFormSchema.parse(mapped);
}

export async function getInferenceConfig(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await getAllSettings(db);

  if (Object.keys(settingsRecords).length > 0) {
    const { success, data: settings } =
      SettingsFormSchema.safeParse(settingsRecords);
    if (success) {
      return settings;
    }
  }

  return;
}
