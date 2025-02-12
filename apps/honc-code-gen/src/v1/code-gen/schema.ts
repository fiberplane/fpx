import { type LanguageModelV1, generateObject } from "ai";
import { z } from "zod";

type SchemaContext = {
  type: "postgres" | "sqlite";
};

export async function generateSchema(
  model: LanguageModelV1,
  databaseSchema: string,
) {
  const PROMPT = `
You are a world class software engineer.
You are an expert in Drizzle ORM, a relational database query building library written in Typescript.

I will give you a written plan for a database schema, and you should turn it into code for a Drizzle ORM database schema definition.

Here is a simple database schema example for D1:

${getD1SchemaExample()}

Here are some additionalcode references:

${getDrizzleSchemaExamples({ type: "sqlite" })}

Here is the database schema plan:

${databaseSchema}
`.trim();

  const result = await generateObject({
    model,
    schema: z.object({
      reasoning: z.string(),
      dbSchemaTs: z.string(),
    }),
    prompt: PROMPT,
  });

  return result.object;
}

// TODO - Update JSONB example to have type safety?
function getDrizzleSchemaExamples(schemaContext: SchemaContext) {
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

function getD1SchemaExample() {
  return `
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
  updatedAt: text("updated_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
});
`.trim();
}
