import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  AI: Ai;
  GOOSIFY_KV: KVNamespace;
  GOOSIFY_R2: R2Bucket;
  FPX_ENDPOINT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const LATEST_LOCALE_KEY = "latest_locale";

// Middleware to set the locale in kv-storage
app.use(async (c, next) => {
  console.log("Setting locale");
  const storedLocale = await c.env.GOOSIFY_KV.get(LATEST_LOCALE_KEY);

  let locale = c.req.header("Accept-Language") || "en";

  // Optional: Parse the "Accept-Language" header to get the most preferred language
  locale = parseAcceptLanguage(locale);

  if (storedLocale !== locale) {
    console.log(`Setting latest locale to ${locale}`);
    await c.env.GOOSIFY_KV.put(LATEST_LOCALE_KEY, locale);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/geese", async (c) => {
  // NOTE - This is equivalent to a raw D1 query
  // const geese = await c.env.DB.prepare("SELECT * FROM geese").all();
  const db = drizzle(c.env.DB);
  const geese = await db.select().from(schema.geese);
  return c.json({ geese });
});

app.get("/api/Gans", async (c) => {
  const prompt = c.req.query("prompt") || "What's happenin' Gans?";

  const messages = [
    {
      role: "system",
      content:
        "You are a friendly German Gans. You speak only of Geese. You speak only in German. You are a little grumpy",
    },
    {
      role: "user",
      content: prompt,
    },
  ];
  const response = await c.env.AI.run(
    "@cf/thebloke/discolm-german-7b-v1-awq",
    // NOTE - This is an issue with the types
    // https://github.com/cloudflare/workerd/issues/2181
    { messages } as BaseAiTextGeneration["inputs"],
  );

  return c.json(response);
});

// TODO
app.get("/api/cyberpunk-goose", async (c) => {
  const inputs = {
    prompt: "cyberpunk goose",
  };
  const cyberpunkGooseImage = await c.env.AI.run(
    "@cf/lykon/dreamshaper-8-lcm",
    inputs,
  );

  const blob = new Blob([cyberpunkGooseImage], { type: "image/png" });
  const filename = `cyberpunk-goose--${crypto.randomUUID()}.png`;
  await c.env.GOOSIFY_R2.put(filename, blob);

  const db = drizzle(c.env.DB);
  await db.insert(schema.gooseImages).values({
    filename,
    prompt: inputs.prompt,
  });

  c.header("Content-Type", "image/png");
  return c.body(cyberpunkGooseImage);
});

export default instrument(app);

function parseAcceptLanguage(acceptLanguage: string) {
  // Simple parser to get the most preferred language
  const locales = acceptLanguage.split(",").map((lang) => {
    const parts = lang.split(";");
    return {
      locale: parts[0],
      q: parts[1] ? Number.parseFloat(parts[1].split("=")[1]) : 1,
    };
  });
  locales.sort((a, b) => b.q - a.q);
  return locales[0].locale; // Return the most preferred language
}
