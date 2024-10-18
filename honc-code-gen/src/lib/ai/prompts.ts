import { PromptTemplate } from "@langchain/core/prompts";
import type { SchemaContext } from "../../types";

export const invokeScaffoldAppPrompt = async ({
  indexFile,
  schemaFile,
  schemaContext,
  seedFile,
  userPrompt,
}: {
  indexFile: string;
  schemaFile: string;
  schemaContext: SchemaContext | null;
  seedFile: string;
  userPrompt: string;
}) => {
  let databaseDescription = "";
  let drizzleSchemaExample = "";
  if (schemaContext) {
    drizzleSchemaExample = getDrizzleSchemaExample(schemaContext);
    databaseDescription = cleanPrompt(`
      I am using a ${schemaContext.type} database, hosted by ${schemaContext.vendor}.
      The Drizzle import path is: ${schemaContext.drizzleImport}
    `);
  }

  const userPromptInterface = await scaffoldAppPrompt.invoke({
    indexFile,
    schemaFile,
    databaseDescription,
    drizzleSchemaExample,
    seedFile,
    userPrompt,
  });
  return userPromptInterface.value;
};

export const scaffoldAppPrompt = PromptTemplate.fromTemplate(
  `
I need to scaffold a Hono API. I bootstrapped the app with a template.

However, I want to modify these template files to better suit my app idea.

===

{databaseDescription}

Here is the Drizzle schema for the database:

<file language=typescript path=src/db/schema.ts>
{schemaFile}
</file>

{drizzleSchemaExample}

Tips:

- Do not change the database adapter (postgres, sqlite, etc). It is correct.
- Avoid defining complex relations if you can. Just give me a good start.

===

Here is the current seed file:

<file language=typescript name=seed.ts>
{seedFile}
</file>

For the seed data file, a few tips:

- Import the schema like this: \`import * as schema from "./src/db/schema"\`.
- Keep any dotenv configuration \`config({{ path: ".dev.vars" }})\`
- If you need to load the database url from an env variable, use \`process.env.DATABASE_URL\`
- Preserve comments when possible
- Add your own comments to explain your thought process and choices to future developers

===

The current index.ts file is below.

Design a simple CRUD api for key resources in the app. Expose a REST api for creating, reading, updating, and deleting resources.

For streaming or realtime apis, add a TODO comment with a link to the following documentation:

Streaming:
- https://hono.dev/docs/helpers/streaming#streaming-helper

Realtime:
- https://developers.cloudflare.com/durable-objects/
- https://fiberplane.com/blog/creating-websocket-server-hono-durable-objects/

<file language=typescript path=src/index.ts>
{indexFile}
</file>

If you need to make any database queries, take these examples of how the Drizzle ORM and query builder work:

<drizzle-orm-example description="Count the number of users in the database">
import {{ count, eq, sql }} from "drizzle-orm";
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
import {{ eq, sql }} from "drizzle-orm";
// ...

const [user] = await db.select().from(schema.users).where(eq(schema.users.id, "some-user-id"));

// ...
</drizzle-orm-example>

<drizzle-orm-example description="Use greater than or equal to operator">
import {{ gte }} from "drizzle-orm";
// ...

const [user] = await db.select().from(schema.users).where(gte(schema.users.age, 64));

// ...
</drizzle-orm-example>

===

Please make the necessary changes to the template files to better suit the app I want to build.

Follow these guidelines:

- Always respond in valid JSON
- Prefer Number.parseInt over parseInt
- All import paths are correct, so don't modify import paths
- Add new imports from the Drizzle ORM if you need new sql helper functions (like {{ sql }}, {{ gte }}, etc)
- If the file was not provided, return an empty string for that file

This is the description of the app I want to build:

{userPrompt}

Please adapt the files I provided to help me build the app I described.

This is imporant to my career.

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

You will be given an index file, a schema file, and a seed data file.

You will also be provided a user prompt that describes the API you need to build.

You need to change the files to help the user layout the basics of their API, based on what they describe.

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

Think in this order:

1. What tables do I need?
2. What columns do I need?
3. What are the relationships between the tables?
4. What simple data should I seed the database with?
5. How do I design a CRUD api for the database?

Remove existing code from the files that is no longer needed.

If you keep existing code or seed data, make sure it is more *thematically correct* for the app. E.g., with user names.

Pay attention to tips about working with the Drizzle ORM.

Do not return the files unchanged.

Use the tool "scaffold_app". Always respond in valid JSON.
`);

// TODO - Update JSONB example to have type safety?
function getDrizzleSchemaExample(schemaContext: SchemaContext) {
  if (schemaContext.type === "postgres") {
    return `
Here are some examples of how to use the Drizzle ORM to define tables:

<example type="timestamps">
  <typescript>
    import { sql } from "drizzle-orm";
    import { timestamp, pgTable } from "drizzle-orm/pg-core";
    const table = pgTable('table', {
      timestamp1: timestamp(),
      timestamp2: timestamp({ precision: 6, withTimezone: true }),
      timestamp3: timestamp().defaultNow(),
      timestamp4: timestamp().default(sql\`now()\`),
    });
  </typescript>
  <sql>
    CREATE TABLE IF NOT EXISTS "table" (
      "timestamp1" timestamp,
      "timestamp2" timestamp (6) with time zone,
      "timestamp3" timestamp default now(),
      "timestamp4" timestamp default now(),
    );
  </sql>
</example>
<example type="jsonb">
  <typescript>
    import { jsonb, pgTable } from "drizzle-orm/pg-core";
    const table = pgTable('table', {
      jsonb1: jsonb(),
      jsonb2: jsonb().default({ foo: "bar" }),
      jsonb3: jsonb().default(sql\`'{foo: "bar"}'::jsonb\`),
    });
  </typescript>
  <sql>
    CREATE TABLE IF NOT EXISTS "table" (
      "jsonb1" jsonb,
      "jsonb2" jsonb default '{"foo": "bar"}'::jsonb,
      "jsonb3" jsonb default '{"foo": "bar"}'::jsonb,
    );
  </sql>
</example>
${getDrizzleRelationsExample(schemaContext)}
    `;
  }

  if (schemaContext.type === "sqlite") {
    return `
Here are some examples of how to use the Drizzle ORM to define tables:

<example type="numbers,booleans,timestamps">
  <typescript>
    import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
    const table = sqliteTable('table', {
      // you can customize integer mode to be number, boolean, timestamp, timestamp_ms
      numberCol: integer("number_col", { mode: 'number' })
      booleanCol: integer("boolean_col", { mode: 'boolean' })
      timestampMsCol: integer("timestamp_ms_col", { mode: 'timestamp_ms' })
      timestampCol: integer("timestamp_col", { mode: 'timestamp' }) // Date 
      createdAt: text("created_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
      updatedAt: text("updated_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
    });
  </typescript>
  <sql>
    CREATE TABLE \`table\` (
      \`number_col\` integer,
      \`boolean_col\` integer,
      \`timestamp_ms_col\` integer,
      \`timestamp_col\` integer,
      \`created_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
      \`updated_at\` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
    );
  </sql>
</example>
${getDrizzleRelationsExample(schemaContext)}
    `;
  }

  return "";
}

function getDrizzleRelationsExample(schemaContext: SchemaContext) {
  if (schemaContext.type === "postgres") {
    return `
<example type="relations" relationType="one-to-one">
  <description>
    An example of a one-to-one relation between users and users, where a user can invite another (this example uses a self reference):
  </description>
  <typescript>
    import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';
    import { relations } from 'drizzle-orm';
    export const users = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name'),
      invitedBy: integer('invited_by'),
    });
    export const usersRelations = relations(users, ({ one }) => ({
      invitee: one(users, {
        fields: [users.invitedBy],
        references: [users.id],
      }),
    }));
  </typescript>
</example>
<example type="relations" relationType="many-to-one">
  <description>
      Drizzle ORM provides you an API to define one-to-many relations between tables with relations operator.
      Example of one-to-many relation between users and posts they've written,
      and comments on those posts..
  </description>
  <typescript>
    import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
    import { relations } from 'drizzle-orm';
    export const users = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name'),
    });
    export const usersRelations = relations(users, ({ many }) => ({
      posts: many(posts),
    }));
    export const posts = pgTable('posts', {
      id: serial('id').primaryKey(),
      content: text('content'),
      authorId: integer('author_id'),
    });
    export const postsRelations = relations(posts, ({ one, many }) => ({
      author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
      }),
      comments: many(comments)
    }));
    export const comments = pgTable('comments', {
      id: serial('id').primaryKey(),
      text: text('text'),
      authorId: integer('author_id'),
      postId: integer('post_id'),
    });
    export const commentsRelations = relations(comments, ({ one }) => ({
      post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
      }),
    }));
  </typescript>
</example>
<example type="relations" relationType="many-to-many">
  <description>
    Drizzle ORM provides you an API to define many-to-many relations between tables through so called junction or join tables, they have to be explicitly defined and store associations between related tables.
    Example of many-to-many relation between users and groups:
  </description>
  <typescript>
      import { relations } from 'drizzle-orm';
      import { integer, pgTable, primaryKey, serial, text } from 'drizzle-orm/pg-core';
      export const users = pgTable('users', {
        id: serial('id').primaryKey(),
        name: text('name'),
      });
      export const usersRelations = relations(users, ({ many }) => ({
        usersToGroups: many(usersToGroups),
      }));
      export const groups = pgTable('groups', {
        id: serial('id').primaryKey(),
        name: text('name'),
      });
      export const groupsRelations = relations(groups, ({ many }) => ({
        usersToGroups: many(usersToGroups),
      }));
      export const usersToGroups = pgTable(
        'users_to_groups',
        {
          userId: integer('user_id')
            .notNull()
            .references(() => users.id),
          groupId: integer('group_id')
            .notNull()
            .references(() => groups.id),
        },
        (t) => ({
          pk: primaryKey({ columns: [t.userId, t.groupId] }),
        }),
      );
      export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
        group: one(groups, {
          fields: [usersToGroups.groupId],
          references: [groups.id],
        }),
        user: one(users, {
          fields: [usersToGroups.userId],
          references: [users.id],
        }),
    }));
  </typescript>
</example>
    `;
  }
  if (schemaContext.type === "sqlite") {
    return `
<example type="relations" relationType="one-to-one">
  <description>
    An example of a one-to-one relation between users and users, where a user can invite another (this example uses a self reference):
  </description>
  <typescript>
    import { sqliteTable, text, integer, boolean } from 'drizzle-orm/sqlite-core';
    import { relations } from 'drizzle-orm';
    export const users = sqliteTable('users', {
      id: integer("id", { mode: "number" }).primaryKey(),
      name: text('name'),
      invitedBy: integer('invited_by'),
    });
    export const usersRelations = relations(users, ({ one }) => ({
      invitee: one(users, {
        fields: [users.invitedBy],
        references: [users.id],
      }),
    }));
  </typescript>
</example>
<example type="relations" relationType="many-to-one">
  <description>
      Drizzle ORM provides you an API to define one-to-many relations between tables with relations operator.
      Example of one-to-many relation between users and posts they've written,
      and comments on those posts..
  </description>
  <typescript>
    import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
    import { relations } from 'drizzle-orm';
    export const users = sqliteTable('users', {
      id: integer("id", { mode: "number" }).primaryKey(),
      name: text('name'),
    });
    export const usersRelations = relations(users, ({ many }) => ({
      posts: many(posts),
    }));
    export const posts = sqliteTable('posts', {
      id: integer("id", { mode: "number" }).primaryKey(),
      content: text('content'),
      authorId: integer('author_id'),
    });
    export const postsRelations = relations(posts, ({ one, many }) => ({
      author: one(users, {
        fields: [posts.authorId],
        references: [users.id],
      }),
      comments: many(comments)
    }));
    export const comments = sqliteTable('comments', {
      id: integer("id", { mode: "number" }).primaryKey(),
      text: text('text'),
      authorId: integer('author_id'),
      postId: integer('post_id'),
    });
    export const commentsRelations = relations(comments, ({ one }) => ({
      post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
      }),
    }));
  </typescript>
</example>
<example type="relations" relationType="many-to-many">
  <description>
    Drizzle ORM provides you an API to define many-to-many relations between tables through so called junction or join tables, they have to be explicitly defined and store associations between related tables.
    Example of many-to-many relation between users and groups:
  </description>
  <typescript>
      import { relations } from 'drizzle-orm';
      import { integer, sqliteTable, primaryKey, text } from 'drizzle-orm/sqlite-core';
      export const users = sqliteTable('users', {
        id: integer("id", { mode: "number" }).primaryKey(),
        name: text('name'),
      });
      export const usersRelations = relations(users, ({ many }) => ({
        usersToGroups: many(usersToGroups),
      }));
      export const groups = sqliteTable('groups', {
        id: integer("id", { mode: "number" }).primaryKey(),
        name: text('name'),
      });
      export const groupsRelations = relations(groups, ({ many }) => ({
        usersToGroups: many(usersToGroups),
      }));
      export const usersToGroups = sqliteTable(
        'users_to_groups',
        {
          userId: integer('user_id')
            .notNull()
            .references(() => users.id),
          groupId: integer('group_id')
            .notNull()
            .references(() => groups.id),
        },
        (t) => ({
          pk: primaryKey({ columns: [t.userId, t.groupId] }),
        }),
      );
      export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
        group: one(groups, {
          fields: [usersToGroups.groupId],
          references: [groups.id],
        }),
        user: one(users, {
          fields: [usersToGroups.userId],
          references: [users.id],
        }),
      }));
  </typescript>
</example>
    `;
  }
  return "";
}

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
