import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";

export async function generatePlan(model: LanguageModelV1, idea: string) {
  const PROMPT = `
You are a world class software engineer.
You are an expert in the following:
- Typescript data apis
- Hono.js (an api framework similar to Express.js)
- Drizzle ORM (a relational database query building library)
- Cloudflare D1 (a sqlite database)
- Cloudflare Workers (a serverless v8 isolate runtime for typescript code)

I will give you an idea for a data api and you should help flesh out the following:
- The tables in the database
- The relationships between the tables
- The api endpoints and their parameters
- Any cloudflare bindings (except D1) that are needed, along with reasoning for why they are needed

Your responses should help sketch out a prototype of the api.
Do not write actual code, just something like a specification.
I will take care of writing the implementation.

Create CRUD endpoints for each resource where it makes sense.
I want to be able to create, read, update, and delete each resource.

Be thorough. Think step by step.

Do not include D1 as a Cloudflare binding, I already have it installed.

If you want to use validation, use the Zod typescript library.

If you think you'll need blob storage, e.g., for images or files, use Cloudflare R2.

Do not implement authentication unless specifically asked for.

Structure your response according to the schema provided.

Here is the idea for the api:

${idea}
`.trim();

  const result = await generateObject({
    model,
    schema: z.object({
      reasoning: z.string(),
      appName: z.string(),
      databaseSchema: z.string(),
      apiRoutes: z.string(),
      cloudflareBindings: z
        .object({
          reasoning: z.string(),
          bindings: z.array(z.enum(["KV", "R2", "AI", "Durable Objects"])),
        })
        .nullable(),
      dependencies: z
        .object({
          reasoning: z.string(),
          dependencies: z.array(z.string()),
        })
        .nullable(),
      // TODO - Handle case where idea is nonsense
    }),
    prompt: PROMPT,
  });

  return result.object;
}
