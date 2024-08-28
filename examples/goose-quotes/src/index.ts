import { Hono } from "hono";

import { instrument } from "@fiberplane/hono-otel";
import { neon } from "@neondatabase/serverless";
import { asc, eq, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { geese } from "./db/schema";

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
  const { shouldHonk } = c.req.query();
  const honk = typeof shouldHonk !== "undefined" ? "Honk honk!" : "";
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

  if (!name) {
    return c.json(await db.select().from(geese));
  }

  const searchResults = await db
    .select()
    .from(geese)
    .where(ilike(geese.name, `%${name}%`))
    .orderBy(asc(geese.name));

  return c.json(searchResults);
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

  const created = await db
    .insert(geese)
    .values({
      name,
      description,
      isFlockLeader,
      programmingLanguage,
      motivations,
      location,
    })
    .returning({
      id: geese.id,
      name: geese.name,
      description: geese.description,
      isFlockLeader: geese.isFlockLeader,
      programmingLanguage: geese.programmingLanguage,
      motivations: geese.motivations,
      location: geese.location,
    });
  return c.json(created?.[0]);
});

/**
 * Generate Goose Quotes
 */
app.post("/api/geese/:id/generate", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  const { name: gooseName } = goose;

  const openaiClient = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
    // HACK - OpenAI freezes fetch when it is imported, so our monkey-patched version needs to be passed here
    fetch: globalThis.fetch,
  });

  const response = await openaiClient.chat.completions.create({
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
  });

  const quotes = response.choices[0].message.content
    ?.split("\n")
    .filter((quote) => quote.length > 0);
  return c.json({ name: goose.name, quotes });
});

/**
 * Get all Geese that are flock leaders
 * Make sure this route is above the `/api/geese/:id` route so that the flock leader is not treated as an id
 */
app.get("/api/geese/flock-leaders", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const flockLeaders = await db
    .select()
    .from(geese)
    .where(eq(geese.isFlockLeader, true));

  return c.json(flockLeaders);
});

/**
 * Get a Goose by id
 */
app.get("/api/geese/:id", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  return c.json(goose);
});

/**
 * Generate Goose Bio
 */
app.post("/api/geese/:id/bio", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  const {
    name: gooseName,
    description,
    programmingLanguage,
    motivations,
    location,
  } = goose;

  const openaiClient = new OpenAI({
    apiKey: c.env.OPENAI_API_KEY,
    fetch: globalThis.fetch,
  });

  const response = await openaiClient.chat.completions.create({
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
  });

  const bio = response.choices[0].message.content;

  // Update the goose with the generated bio
  const updatedGoose = await db
    .update(geese)
    .set({ bio })
    .where(eq(geese.id, +id))
    .returning();

  return c.json(updatedGoose[0]);
});

/**
 * Honk at a Goose by id
 */
app.post("/api/geese/:id/honk", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  return c.json({ message: `Honk honk! ${goose.name} honks back at you!` });
});

/**
 * Update a Goose by id
 */
app.patch("/api/geese/:id", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const { name } = await c.req.json();

  const goose = (
    await db.update(geese).set({ name }).where(eq(geese.id, +id)).returning()
  )?.[0];

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  return c.json(goose);
});

/**
 * Get Geese by programming language
 */
app.get("/api/geese/language/:language", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const language = c.req.param("language");

  const geeseByLanguage = await db
    .select()
    .from(geese)
    .where(ilike(geese.programmingLanguage, `%${language}%`));

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

  const updatedGoose = (
    await db
      .update(geese)
      .set({ motivations })
      .where(eq(geese.id, +id))
      .returning()
  )?.[0];

  if (!updatedGoose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  return c.json(updatedGoose);
});

app.post("/api/geese/:id/change-name-url-form", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const [goose] = await db.select().from(geese).where(eq(geese.id, +id));

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  const form = await c.req.formData();
  const name = form.get("name");

  if (!name) {
    return c.json({ message: "Name is required" }, 400);
  }

  const [updatedGoose] = await db
    .update(geese)
    .set({ name })
    .where(eq(geese.id, +id))
    .returning();

  return c.json(updatedGoose, 200);
});

/**
 * Update a Goose's avatar by id
 */
app.post("/api/geese/:id/avatar", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const [goose] = await db.select().from(geese).where(eq(geese.id, +id));

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  const { avatar, avatarName } = await c.req.parseBody();
  console.log({ avatarName }, "is the avatar name");
  // Validate the avatar is a file
  if (!(avatar instanceof File)) {
    return c.json(
      { message: "Avatar must be a file", actualType: typeof avatar },
      422,
    );
  }

  // Validate the avatar is a JPEG, PNG, or GIF
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(avatar.type)) {
    return c.json({ message: "Avatar must be a JPEG, PNG, or GIF image" }, 422);
  }

  // Get the file extension from the avatar's type
  const fileExtension = avatar.type.split("/")[1];

  // Save the avatar to the bucket
  const bucketKey = `goose-${id}-avatar-${Date.now()}.${fileExtension}`;
  await c.env.GOOSE_AVATARS.put(bucketKey, avatar.stream(), {
    httpMetadata: { contentType: avatar.type },
  });

  const [updatedGoose] = await db
    .update(geese)
    .set({ avatar: bucketKey })
    .where(eq(geese.id, +id))
    .returning();

  return c.json(updatedGoose);
});

/**
 * Get a Goose's avatar by id
 */
app.get("/api/geese/:id/avatar", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");

  const [goose] = await db.select().from(geese).where(eq(geese.id, +id));

  if (!goose) {
    return c.json({ message: "Goose not found" }, 404);
  }

  const avatarKey = goose.avatar;

  if (!avatarKey) {
    return c.json({ message: "Goose has no avatar" }, 404);
  }

  const avatar = await c.env.GOOSE_AVATARS.get(avatarKey);

  if (!avatar) {
    return c.json({ message: "Goose avatar not found" }, 404);
  }

  const responseHeaders = mapR2HttpMetadataToHeaders(avatar.httpMetadata);
  return new Response(avatar.body, {
    headers: responseHeaders,
  });
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage(event, ws) {
        const { type, payload } = JSON.parse(event.data);
        const sql = neon(c.env.DATABASE_URL);
        const db = drizzle(sql);

        switch (type) {
          case "GET_GEESE":
            db.select()
              .from(geese)
              .then((geese) => {
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

            db.insert(geese)
              .values({
                name,
                description,
                isFlockLeader,
                programmingLanguage,
                motivations,
                location,
              })
              .returning({
                id: geese.id,
                name: geese.name,
                description: geese.description,
                isFlockLeader: geese.isFlockLeader,
                programmingLanguage: geese.programmingLanguage,
                motivations: geese.motivations,
                location: geese.location,
              })
              .then((newGoose) => {
                ws.send(
                  JSON.stringify({ type: "NEW_GOOSE", payload: newGoose[0] }),
                );
              });
            break;
          }
          // ... (handle other message types)
          default:
            break;
        }
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  }),
);

export default instrument(app, {
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
