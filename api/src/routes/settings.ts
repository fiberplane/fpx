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
 * 
 * NOTE - We need to start and stop webhonc when the proxy requests setting is updated.
 */
app.post("/v0/settings", cors(), async (ctx) => {
  const currentSettings = await getAllSettings(ctx.get("db"));
  const prevProxyUrlEnabled = currentSettings?.proxyRequestsEnabled;

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

  // HACK - We should techincally JSON parse the value here, but whatever.
  const proxyUrlEnabled = updatedSettings.find((setting) => setting.key === "proxyRequestsEnabled")
    ?.value === "true";
  
  const shouldStartWebhonc = !prevProxyUrlEnabled && proxyUrlEnabled;
  if (shouldStartWebhonc) {
    logger.debug("Proxy requests enabled in settings update, starting webhonc");
    await webhonc.start();
  }

  const shouldStopWebhonc = prevProxyUrlEnabled && !proxyUrlEnabled;
  if (shouldStopWebhonc) {
    logger.debug("Proxy requests disabled in settings update, stopping webhonc");
    await webhonc.stop();
  }

  return ctx.json(updatedSettings);
});

export default app;
