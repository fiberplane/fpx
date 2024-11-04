import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";

const TEMPLATE_SEED = `
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./src/db/schema";

interface User {
  name: string;
  email: string;
}

const seedData: User[] = [
  { name: "Laszlo Cravensworth", email: "laszlo.cravensworth@example.com" },
  { name: "Nadja Antipaxos", email: "nadja.antipaxos@example.com" },
  { name: "Colin Robinson", email: "colin.robinson@example.com" },
];

const seedDatabase = async () => {
  const pathToDb = getLocalD1DB();
  const client = createClient({
    url: \`file:\${pathToDb}\`,
  });
  const db = drizzle(client);
  console.log("Seeding database...");
  try {
    await db.insert(schema.users).values(seedData);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seedDatabase();

function getLocalD1DB() {
  try {
    const basePath = path.resolve(".wrangler");
    const files = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .filter((f) => f.endsWith(".sqlite"));

    // In case there are multiple .sqlite files, we want the most recent one.
    files.sort((a, b) => {
      const statA = fs.statSync(path.join(basePath, a));
      const statB = fs.statSync(path.join(basePath, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    const dbFile = files[0];

    if (!dbFile) {
      throw new Error(\`.sqlite file not found in \${basePath}\`);
    }

    const url = path.resolve(basePath, dbFile);

    return url;
  } catch (err) {
    if (err instanceof Error) {
      console.log(\`Error resolving local D1 DB: \${err.message}\`);
    } else {
      console.log(\`Error resolving local D1 DB: \${err}\`);
    }
  }
}

`;

export async function generateSeed(
  model: LanguageModelV1,
  {
    dbSchema,
  }: {
    dbSchema: string;
  },
  example = TEMPLATE_SEED,
) {
  const PROMPT = `
You are a helpful Typescript developer assistant that generates seed data for a database.

I am using Cloudflare D1 to store relational data for my api.
I am using Drizzle ORM, a typescript ORM, to help generate the seed data.

I will provide you with the database schema and an example seed file.

I have a template file, and I need you to modify it to fit with the schema I've made.

Here is the current seed file:

<file language=typescript name=seed.ts>
${example}
</file>

For the seed data file, a few tips:

- Do not change imports
- Import the schema like this: \`import * as schema from "./src/db/schema"\`.
- Keep any dotenv configuration \`config({{ path: ".dev.vars" }})\`
- If you need to load the database url from an env variable, use \`process.env.DATABASE_URL\`
- Preserve existing comments when possible
- Add your own comments to explain your thought process and choices to future developers

Here is the database schema:

<file language=typescript name=src/db/schema.ts>
${dbSchema}
</file>

Think step by step. Output your reasoning and the final seed file.
`;
  const result = await generateObject({
    model,
    schema: z.object({
      reasoning: z.string().describe("Your reasoning for the seed data"),
      seedTs: z.string().describe("The final seed.ts file"),
    }),
    prompt: PROMPT,
  });

  return result.object;
}
