import { Hono, type HonoRequest } from "hono";

import { instrument, measure } from "@fiberplane/hono-otel";
import { neon } from "@neondatabase/serverless";
import { asc, eq, ilike, isNull, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import {
  createGoose,
  getAllGeese,
  getGeeseByLanguage,
  getGooseById,
  updateGoose,
} from "./db/client";
import { geese } from "./db/schema";
import { shouldHonk } from "./utils";

import { upgradeWebSocket } from "hono/cloudflare-workers";
import { OpenAI } from "openai";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GOOSE_AVATARS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Home page
 *
 * If `shouldHonk` query parameter is present, then print "Honk honk!"
 */
app.get("/", (c) => {
  const honk = shouldHonk(c.req) ? "Honk honk!" : "";
  console.log(`Home page accessed. Honk: ${honk}`);
  return c.text(`Hello Goose Quotes! ${honk}`.trim());
});

/**
 * Search Geese by name
 *
 * If `name` query parameter is not defined, then return all geese
 */
app.get("/api/geese", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const name = c.req.query("name");
  console.log({ action: "search_geese", name });

  if (!name) {
    const allGeese = await measure("getAllGeese", () => getAllGeese(db))();
    console.log({ action: "get_all_geese", count: allGeese.length });
    return c.json(allGeese);
  }

  const searchResults = await measure("searchGeese", () =>
    db
      .select()
      .from(geese)
      .where(ilike(geese.name, `%${name}%`))
      .orderBy(asc(geese.name)),
  )();

  console.log({
    action: "search_geese_results",
    count: searchResults.length,
    name,
  });

  return c.json(searchResults);
});

/**
 * Search for geese with avatars
 */
app.get("/api/geese-with-avatar", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Fetching geese with avatars");

  const geeseWithAvatars = await measure("getGeeseWithAvatars", () =>
    db
      .select()
      .from(geese)
      .where(not(isNull(geese.avatar)))
      .orderBy(asc(geese.id)),
  )();

  console.log(`Found ${geeseWithAvatars.length} geese with avatars`);
  return c.json(geeseWithAvatars.map((g) => g.id));
});

/**
 * Create a Goose and return the Goose
 *
 * Only requires a `name` parameter in the request body
 */
app.post("/api/geese", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const { name, isFlockLeader, programmingLanguage, motivations, location } =
    await c.req.json();
  const description = `A person named ${name} who talks like a Goose`;

  console.log(`Creating new goose: ${name}`);

  const created = await measure("createGoose", () =>
    createGoose(db, {
      name,
      description,
      isFlockLeader,
      programmingLanguage,
      motivations,
      location,
    }),
  )();
  console.log({ action: "create_goose", id: created[0].id, name });
  return c.json(created);
});

/**
 * Generate Goose Quotes
 */
app.post("/api/geese/:id/generate", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const { name: gooseName } = goose;

  const openaiClient = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
    // HACK - OpenAI freezes fetch when it is imported, so our monkey-patched version needs to be passed here
    fetch: globalThis.fetch,
  });

  console.log(`Generating quotes for goose: ${gooseName}`);

  const response = await measure("generateQuotes", () =>
    openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: trimPrompt(`
              You are a goose. You are a very smart goose. You are part goose, part AI. You are a GooseAI.
              You are also influenced heavily by the work of ${gooseName}.

              Always respond without preamble. If I ask for a list, give me a newline-separated list. That's it.
              Don't number it. Don't bullet it. Just newline it.

              Never forget to Honk. A lot.
          `),
        },
        {
          role: "user",
          content: trimPrompt(`
              Reimagine five famous quotes by ${gooseName}, except with significant goose influence.
          `),
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  )();

  const quotes = response.choices[0].message.content
    ?.split("\n")
    .filter((quote) => quote.length > 0);
  console.log({
    action: "generate_quotes",
    gooseName,
    quoteCount: quotes?.length,
  });
  return c.json({ name: goose.name, quotes });
});

/**
 * Get all Geese that are flock leaders
 * Make sure this route is above the `/api/geese/:id` route so that the flock leader is not treated as an id
 */
app.get("/api/geese/flock-leaders", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Fetching flock leaders");

  const flockLeaders = await measure("getFlockLeaders", () =>
    db.select().from(geese).where(eq(geese.isFlockLeader, true)),
  )();

  console.log(`Found ${flockLeaders.length} flock leaders`);

  return c.json(flockLeaders);
});

/**
 * Get a Goose by id
 */
app.get("/api/geese/:id", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  console.log(`Fetching goose with id: ${id}`);

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  console.log(`Found goose: ${goose.name}`);
  return c.json(goose);
});

/**
 * Generate Goose Bio
 */
app.post("/api/geese/:id/bio", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const {
    name: gooseName,
    description,
    programmingLanguage,
    motivations,
    location,
  } = goose;

  console.log(`Generating bio for goose: ${gooseName}`);

  const openaiClient = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
    fetch: globalThis.fetch,
  });

  const response = await measure("generateBio", () =>
    openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: trimPrompt(`
              You are a professional bio writer. Your task is to generate a compelling and engaging bio for a goose.
          `),
        },
        {
          role: "user",
          content: trimPrompt(`
              Generate a bio for a goose named ${gooseName} with the following details:
              Description: ${description}
              Programming Language: ${programmingLanguage}
              Motivations: ${motivations}
              Location: ${location}
          `),
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  )();

  const bio = response.choices[0].message.content;

  // Update the goose with the generated bio
  const updatedGoose = await measure("updateGoose", () =>
    updateGoose(db, +id, { bio }),
  )();

  console.log(`Bio generated and updated for goose: ${gooseName}`);
  return c.json(updatedGoose);
});

/**
 * Honk at a Goose by id
 */
app.post("/api/geese/:id/honk", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const currentHonks = goose.honks || 0;

  const updatedGoose = await measure("updateGoose", () =>
    updateGoose(db, +id, { honks: currentHonks + 1 }),
  )();

  console.log(
    `Honk received for goose: ${goose.name}. New honk count: ${updatedGoose.honks}`,
  );
  return c.json({
    message: `Honk honk! ${goose.name} honks back at you!`,
    honks: updatedGoose.honks,
  });
});

/**
 * Update a Goose by id
 */
app.patch("/api/geese/:id", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const updateData = await c.req.json();

  console.log(`Updating goose ${id} with data:`, updateData);

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  // Simulate a race condition by splitting the update into multiple parts
  const updatePromises = Object.entries(updateData).map(
    async ([key, value]) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
      return measure("updateGoose", () =>
        updateGoose(db, +id, { [key]: value }),
      )();
    },
  );

  await Promise.all(updatePromises);

  const updatedGoose = await measure("getGooseById", () =>
    getGooseById(db, +id),
  )();

  console.log(`Goose ${id} updated successfully`);
  return c.json(updatedGoose);
});

/**
 * Get Geese by programming language
 */
app.get("/api/geese/language/:language", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const language = c.req.param("language");

  console.log(`Fetching geese with programming language: ${language}`);

  const geeseByLanguage = await measure("getGeeseByLanguage", () =>
    getGeeseByLanguage(db, language),
  )();

  console.log(
    `Found ${geeseByLanguage.length} geese for language: ${language}`,
  );
  return c.json(geeseByLanguage);
});

/**
 * Update a Goose's motivations by id
 */
app.patch("/api/geese/:id/motivations", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const { motivations } = await c.req.json();

  console.log(`Updating motivations for goose ${id}`);

  const updatedGoose = await measure("updateGoose", () =>
    updateGoose(db, +id, { motivations }),
  )();

  if (!updatedGoose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  console.log(`Motivations updated for goose ${id}`);
  return c.json(updatedGoose);
});

app.post("/api/geese/:id/change-name-url-form", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const form = await c.req.formData() as FormData;
  const name = form.get("name");

  if (!name) {
    console.error("Name is required for changing goose name");
    return c.json({ message: "Name is required" }, 400);
  }

  console.log(`Changing name of goose ${id} to ${name}`);
  const updatedGoose = await measure("updateGoose", () =>
    updateGoose(db, +id, { name }),
  )();

  console.log(`Name changed for goose ${id}`);
  return c.json(updatedGoose, 200);
});

/**
 * Update a Goose's avatar by id
 */
app.post("/api/geese/:id/avatar", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const { avatar, avatarName } = await c.req.parseBody();
  console.log({ action: "update_avatar", gooseId: id, avatarName });
  // Validate the avatar is a file
  if (!(avatar instanceof File)) {
    console.error(`Invalid avatar type for goose ${id}: ${typeof avatar}`);
    return c.json(
      { message: "Avatar must be a file", actualType: typeof avatar },
      422,
    );
  }

  // Validate the avatar is a JPEG, PNG, or GIF
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(avatar.type)) {
    console.error(`Invalid avatar file type for goose ${id}: ${avatar.type}`);
    return c.json({ message: "Avatar must be a JPEG, PNG, or GIF image" }, 422);
  }

  // Get the file extension from the avatar's type
  const fileExtension = avatar.type.split("/")[1];

  // Save the avatar to the bucket
  const bucketKey = `goose-${id}-avatar-${Date.now()}.${fileExtension}`;
  await measure("uploadAvatar", () =>
    c.env.GOOSE_AVATARS.put(bucketKey, avatar.stream(), {
      httpMetadata: { contentType: avatar.type },
    }),
  )();

  console.log(`Avatar uploaded for goose ${id}: ${bucketKey}`);

  const updatedGoose = await measure("updateGoose", () =>
    updateGoose(db, +id, { avatar: bucketKey }),
  )();

  console.log(`Avatar updated for goose ${id}`);
  return c.json(updatedGoose);
});

/**
 * Get a Goose's avatar by id
 */
app.get("/api/geese/:id/avatar", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(`Goose not found: ${id}`);
    return c.json({ message: "Goose not found" }, 404);
  }

  const avatarKey = goose.avatar;

  if (!avatarKey) {
    console.warn(`Goose ${id} has no avatar`);
    return c.json({ message: "Goose has no avatar" }, 404);
  }

  console.log(`Fetching avatar for goose ${id}: ${avatarKey}`);

  const avatar = await measure("getAvatar", () =>
    c.env.GOOSE_AVATARS.get(avatarKey),
  )();

  if (!avatar) {
    console.error(`Avatar not found for goose ${id}: ${avatarKey}`);
    return c.json({ message: "Goose avatar not found" }, 404);
  }

  console.log(`Avatar retrieved for goose ${id}`);
  const responseHeaders = mapR2HttpMetadataToHeaders(avatar.httpMetadata);
  return new Response(avatar.body, {
    headers: responseHeaders,
  });
});

/**
 * `app.all` test
 *
 * For all methods, print "Honk honk!"
 */
app.all("/always-honk/:echo?", (c) => {
  const echo = c.req.param("echo");
  console.log(`Always honk endpoint called with echo: ${echo}`);
  return c.text(`Honk honk! ${echo ?? ""}`);
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const { type, payload } = JSON.parse(event.data);
        const sql = neon(c.env.DATABASE_URL);
        const db = drizzle(sql);

        console.log(`WebSocket message received: ${type}`);

        switch (type) {
          case "GET_GEESE":
            measure("getAllGeese", () => getAllGeese(db))().then((geese) => {
              console.log(`Sending ${geese.length} geese over WebSocket`);
              ws.send(JSON.stringify({ type: "GEESE", payload: geese }));
            });
            break;
          case "CREATE_GOOSE": {
            const {
              name,
              isFlockLeader,
              programmingLanguage,
              motivations,
              location,
            } = payload;
            const description = `A person named ${name} who talks like a Goose`;

            console.log(`Creating new goose via WebSocket: ${name}`);
            measure("createGoose", () =>
              createGoose(db, {
                name,
                description,
                isFlockLeader,
                programmingLanguage,
                motivations,
                location,
              }),
            )().then((newGoose) => {
              console.log(`New goose created via WebSocket: ${newGoose[0].id}`);
              ws.send(JSON.stringify({ type: "NEW_GOOSE", payload: newGoose }));
            });
            break;
          }
          // ... (handle other message types)
          default:
            console.warn(`Unknown WebSocket message type: ${type}`);
            break;
        }
      },
      onClose: () => {
        console.log("WebSocket connection closed");
      },
    };
  }),
);

export default instrument(app, {
  libraryDebugMode: true,
  monitor: {
    fetch: true,
    logging: true,
    cfBindings: true,
  },
});

function trimPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}

function mapR2HttpMetadataToHeaders(metadata?: R2HTTPMetadata): Headers {
  const headers = new Headers();

  if (!metadata) {
    return headers;
  }

  if (metadata.contentType) {
    headers.set("Content-Type", metadata.contentType);
  }
  if (metadata.contentLanguage) {
    headers.set("Content-Language", metadata.contentLanguage);
  }
  if (metadata.contentDisposition) {
    headers.set("Content-Disposition", metadata.contentDisposition);
  }
  if (metadata.contentEncoding) {
    headers.set("Content-Encoding", metadata.contentEncoding);
  }
  if (metadata.cacheControl) {
    headers.set("Cache-Control", metadata.cacheControl);
  }
  if (metadata.cacheExpiry) {
    headers.set("Cache-Expiry", metadata.cacheExpiry.toUTCString());
  }

  return headers;
}
