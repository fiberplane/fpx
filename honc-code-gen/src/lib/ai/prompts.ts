import { PromptTemplate } from "@langchain/core/prompts";

export const invokeScaffoldAppPrompt = async ({
  indexFile,
  schemaFile,
  seedFile,
  userPrompt,
}: {
  indexFile: string;
  schemaFile: string;
  seedFile: string;
  userPrompt: string;
}) => {
  const userPromptInterface = await scaffoldAppPrompt.invoke({
    indexFile,
    schemaFile,
    seedFile,
    userPrompt,
  });
  return userPromptInterface.value;
};

export const scaffoldAppPrompt = PromptTemplate.fromTemplate(
  `
I need to scaffold an app. I already set up several key files via a template.

However, I want to modify these template files to better suit my needs.

===

Here is the current index.ts file:

<file language=typescript path=src/index.ts>
{indexFile}
</file>

If you need to make any database queries, take these examples of how the Drizzle ORM and query builder work:

<drizzle-orm-example description="Count the number of users in the database">
import {{ count }} from "drizzle-orm";
// ...

  // Rename destructured property to avoid name collision
  const [ {{ count: usersCount }} ] = await db.select({{ count: count() }}).from(schema.users);

// ...
</drizzle-orm-example>

<drizzle-orm-example description="Order items by createdAt field in descending order">
import {{ desc }} from "drizzle-orm";
// ...

  const orderedItems = await db.select().from(schema.items).orderBy(desc(schema.items.createdAt));

// ...
</drizzle-orm-example>

<drizzle-orm-example description="Select a user by id using the eq operator">
import {{ eq }} from "drizzle-orm";
// ...

const [user] = await db.select().from(schema.users).where(eq(schema.users.id, "some-user-id"));

// ...
</drizzle-orm-example>

===

Here is the Drizzle schema for the postgres database:

<file language=typescript path=src/db/schema.ts>
{schemaFile}
</file>

===

Here is the current seed file:

<file language=typescript name=seed.ts>
{seedFile}
</file>

For the seed data file, a few tips:

- Import the schema like this: \`import {{ schema }} from "./src/db/schema"\`.
- Keep any dotenv configuration \`config({{ path: ".dev.vars" }})\`
- If you need to load the database url from an env variable, use \`process.env.DATABASE_URL\`
- Preserve comments when possible
- Add your own comments to explain your thought process and choices to future developers

===

Please make the necessary changes to the template files to better suit the app I want to build.

Follow these guidelines:

- Always respond in valid JSON
- Only make changes to the files provided, do not make changes outside of the provided files
- Prefer Number.parseInt over parseInt
- All imports are correct, so don't modify import paths
- If the file was not provided, return an empty string for that file


This is the description of the app I want to build:

{userPrompt}

`.trim(),
);

export const SYSTEM_PROMPT = cleanPrompt(`
You are a friendly, expert full-stack engineer and an API building assistant for apps that use Hono,
a typescript web framework similar to express.

You are using the HONC stack:

- Hono for the API
- Drizzle ORM for the database
- Neon for the database (serverless postgres)
- Cloudflare Workers for the deployment target

You will be provided an index file, a schema file, and a seed data file.

You will also be provided a user prompt that describes the API you need to build.

You need to use the provided files to help the user layout the basics of their API based, on what they describe.

A few tips:

For Hono apis on Cloudflare Workers, you must access environment variables from a context parameter within the request handler functions.

So, in "index.ts", you might see something like this:

\`\`\`typescript
app.get("/", (c) => {
  const DATABASE_URL = c.env.DATABASE_URL;
  // ...
});
\`\`\`

That is correct, do not modify it to use process.env!

In the seed file, you can use process.env.DATABASE_URL directly, as this is not running inside the API. It is a script.

Also export default instrument(app); <-- do not modify that line. Keep instrumenting the app as is, if it is instrumented.

===

Pay attention to tips about working with the Drizzle ORM.

Use the tool "scaffold_app". Always respond in valid JSON.
`);

/**
 * Clean a prompt by trimming whitespace for each line and joining the lines.
 */
export function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
