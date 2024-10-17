import OpenAI from "openai";
import type { AppLogger } from "../../logger";
import { SYSTEM_PROMPT, invokeScaffoldAppPrompt } from "./prompts";
import { scaffoldAppTool } from "./tools";

export const FILES_TO_MODIFY = ["src/index.ts", "src/db/schema.ts", "seed.ts"];

export async function buildWithOpenAi(
  {
    apiKey,
    indexFile,
    schemaFile,
    seedFile,
    userPrompt,
  }: {
    apiKey: string;
    indexFile: string;
    schemaFile: string;
    seedFile: string;
    userPrompt: string;
  },
  logger: AppLogger,
) {
  // logger.debug("Building with OpenAI!");
  // logger.debug(
  //   `Index file (truncated): ${indexFile.replace(/\n/g, "\\n").substring(0, 100)}...`,
  // );
  // logger.debug(
  //   `Schema file (truncated): ${schemaFile.replace(/\n/g, "\\n").substring(0, 100)}...`,
  // );
  // logger.debug(
  //   `Seed data file (truncated): ${seedFile.replace(/\n/g, "\\n").substring(0, 100)}...`,
  // );
  // logger.debug(
  //   `User prompt (truncated): ${userPrompt.replace(/\n/g, "\\n").substring(0, 100)}...`,
  // );
  const openaiClient = new OpenAI({ apiKey, fetch: globalThis.fetch });

  // TODO - Chain requests to create each file and emit updates to the client
  const response = await openaiClient.chat.completions.create({
    // NOTE - Later models (gpt-4o, gpt-4-turbo) should guarantee function calling to have json output
    model: "gpt-4o",
    // NOTE - We can restrict the response to be from this single tool call
    tool_choice: {
      type: "function",
      function: { name: scaffoldAppTool.function.name },
    },
    tools: [scaffoldAppTool],
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: await invokeScaffoldAppPrompt({
          indexFile,
          schemaFile,
          seedFile,
          userPrompt,
        }),
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  const {
    choices: [{ message }],
  } = response;

  const toolCall = message.tool_calls?.[0];
  const toolArgs = toolCall?.function?.arguments;

  // logger.debug("Openai response", JSON.stringify(message, null, 2));

  try {
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;
    return parsedArgs;
  } catch (error) {
    logger.error("Parsing tool-call response from OpenAI failed:", error);
    throw new Error("Could not parse response from OpenAI");
  }
}

export async function buildWithAnthropicMock() {
  await new Promise((resolve) => setTimeout(resolve, 4000));
  return {
    indexFile:
      "import { Hono } from 'hono'\nimport { drizzle } from 'drizzle-orm/neon-http'\nimport { neon } from '@neondatabase/serverless'\nimport { users } from './db/schema'\n\nconst app = new Hono()\n\nconst sql = neon(process.env.DATABASE_URL!)\nconst db = drizzle(sql)\n\napp.get('/', (c) => c.text('Hello Hono!'))\n\n// User routes\napp.get('/users', async (c) => {\n  const allUsers = await db.select().from(users)\n  return c.json(allUsers)\n})\n\napp.post('/users', async (c) => {\n  const body = await c.req.json()\n  const newUser = await db.insert(users).values(body).returning()\n  return c.json(newUser)\n})\n\napp.get('/users/:id', async (c) => {\n  const id = c.req.param('id')\n  const user = await db.select().from(users).where(eq(users.id, parseInt(id))).first()\n  if (!user) return c.notFound()\n  return c.json(user)\n})\n\napp.put('/users/:id', async (c) => {\n  const id = c.req.param('id')\n  const body = await c.req.json()\n  const updatedUser = await db.update(users).set(body).where(eq(users.id, parseInt(id))).returning()\n  if (!updatedUser.length) return c.notFound()\n  return c.json(updatedUser[0])\n})\n\napp.delete('/users/:id', async (c) => {\n  const id = c.req.param('id')\n  const deletedUser = await db.delete(users).where(eq(users.id, parseInt(id))).returning()\n  if (!deletedUser.length) return c.notFound()\n  return c.json({ message: 'User deleted successfully' })\n})\n\nexport default app",
    schemaFile:
      "import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';\nimport { createInsertSchema, createSelectSchema } from 'drizzle-zod';\nimport { z } from 'zod';\n\nexport const users = pgTable('users', {\n  id: serial('id').primaryKey(),\n  username: varchar('username', { length: 255 }).notNull().unique(),\n  email: varchar('email', { length: 255 }).notNull().unique(),\n  password: varchar('password', { length: 255 }).notNull(),\n  fullName: text('full_name'),\n  createdAt: timestamp('created_at').defaultNow().notNull(),\n  updatedAt: timestamp('updated_at').defaultNow().notNull(),\n});\n\nexport const userSelectSchema = createSelectSchema(users);\nexport const userInsertSchema = createInsertSchema(users);\n\nexport type User = z.infer<typeof userSelectSchema>;\nexport type NewUser = z.infer<typeof userInsertSchema>;",
    seedFile:
      "import { neon } from '@neondatabase/serverless';\nimport { drizzle } from 'drizzle-orm/neon-http';\nimport { users } from './db/schema';\n\nconst sql = neon(process.env.DATABASE_URL!);\nconst db = drizzle(sql);\n\nasync function seed() {\n  try {\n    await db.insert(users).values([\n      {\n        username: 'johndoe',\n        email: 'john@example.com',\n        password: 'hashedpassword123',\n        fullName: 'John Doe',\n      },\n      {\n        username: 'janedoe',\n        email: 'jane@example.com',\n        password: 'hashedpassword456',\n        fullName: 'Jane Doe',\n      },\n    ]);\n    console.log('Seed data inserted successfully');\n  } catch (error) {\n    console.error('Error seeding data:', error);\n  }\n}\n\nseed();",
  };
}
