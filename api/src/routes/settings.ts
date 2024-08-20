import { SettingsSchema } from "@fiberplane/fpx-types";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAllSettings, upsertSettings } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Retrieve the settings record
 */
app.get("/v0/settings", cors(), async (ctx) => {
  const db = ctx.get("db");
  const settingsRecord = await getAllSettings(db);
  return ctx.json(settingsRecord);
});

/**
 * Upsert the settings record
 */
app.post("/v0/settings", cors(), async (ctx) => {
  const { content } = (await ctx.req.json()) as {
    content: Record<string, string>;
  };

  const parsedContent = SettingsSchema.parse(content);
  // Remove the stored api key if the feature is disabled
  if (!parsedContent.aiEnabled) {
    parsedContent.openaiApiKey = undefined;
    parsedContent.anthropicApiKey = undefined;
  }

  logger.debug("Updating settings", { content });

  const db = ctx.get("db");
  const webhonc = ctx.get("webhonc");

  const updatedSettings = await upsertSettings(db, parsedContent);

  logger.debug("Configuration updated...");

  const proxyUrlEnabled = !!Number(
    updatedSettings.find((setting) => setting.key === "proxyRequestsEnabled")
      ?.value,
  );

  if (proxyUrlEnabled) {
    await webhonc.start();
  }

  if (!proxyUrlEnabled) {
    await webhonc.stop();
  }

  return ctx.json(updatedSettings);
});

export default app;
