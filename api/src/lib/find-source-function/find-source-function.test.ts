import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { findSourceFunction } from "./find-source-function.js";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path and analyze the 'src' directory
const testContentsDir = path.resolve(__dirname, "./test-data/hono-js-tracker");

describe("findSourceFunction", () => {
  describe("handler", () => {
    const HANDLER_COMPILED_CODE =
      'async (c) => {\n  const db2 = c.var.db;\n  const webhooks2 = c.var.webhooks;\n  const fetchUserById = c.var.fetchUserById;\n  webhooks2.on(\n    ["issues.opened", "star.created", "watch.started"],\n    async ({ payload, name }) => {\n      const userId = payload.sender.id;\n      try {\n        await db2.insert(repositories).values({\n          description: payload.repository.description,\n          fullName: payload.repository.full_name,\n          id: payload.repository.id,\n          name: payload.repository.name,\n          stargazersCount: payload.repository.stargazers_count,\n          watchersCount: payload.repository.watchers_count\n        }).onConflictDoUpdate({\n          target: repositories.id,\n          set: {\n            stargazersCount: payload.repository.stargazers_count,\n            watchersCount: payload.repository.watchers_count\n          }\n        });\n      } catch (error) {\n        return c.text(`Error fetching repository: ${error}`, 500);\n      }\n      try {\n        const user = await fetchUserById(userId);\n        await db2.insert(users).values({\n          avatar: user.avatar_url,\n          company: user.company,\n          emailAddress: user.email,\n          handle: user.login,\n          id: user.id,\n          location: user.location,\n          name: user.name,\n          twitterHandle: user.twitter_username\n        }).onConflictDoNothing({ target: users.id });\n      } catch (error) {\n        return c.text(`Error inserting user: ${error}`, 500);\n      }\n      let eventId;\n      if (name === "issues") {\n        eventId = payload.issue.id;\n      }\n      try {\n        await db2.insert(events).values({\n          eventId,\n          eventAction: payload.action,\n          eventName: name,\n          repoId: payload.repository.id,\n          userId\n        });\n      } catch (error) {\n        return c.text(`Error inserting event: ${error}`, 500);\n      }\n    }\n  );\n}';
    const HANDLE_SOURCE_CODE = `async (c) => {
  const db = c.var.db;
  const webhooks = c.var.webhooks;
  const fetchUserById = c.var.fetchUserById;

  webhooks.on(
    ["issues.opened", "star.created", "watch.started"],
    async ({ payload, name }) => {
      const userId = payload.sender.id;

      try {
        await db
          .insert(repositories)
          .values({
            description: payload.repository.description,
            fullName: payload.repository.full_name,
            id: payload.repository.id,
            name: payload.repository.name,
            stargazersCount: payload.repository.stargazers_count,
            watchersCount: payload.repository.watchers_count,
          })
          .onConflictDoUpdate({
            target: repositories.id,
            set: {
              stargazersCount: payload.repository.stargazers_count,
              watchersCount: payload.repository.watchers_count,
            },
          });
      } catch (error) {
        return c.text(\`Error fetching repository: \${error}\`, 500);
      }

      try {
        const user = await fetchUserById(userId);

        await db
          .insert(users)
          .values({
            avatar: user.avatar_url,
            company: user.company,
            emailAddress: user.email,
            handle: user.login,
            id: user.id,
            location: user.location,
            name: user.name,
            twitterHandle: user.twitter_username,
          })
          .onConflictDoNothing({ target: users.id });
      } catch (error) {
        return c.text(\`Error inserting user: \${error}\`, 500);
      }

      // Only issues have an event ID
      let eventId: number | undefined;
      if (name === "issues") {
        eventId = payload.issue.id;
      }

      try {
        await db.insert(events).values({
          eventId,
          eventAction: payload.action,
          eventName: name,
          repoId: payload.repository.id,
          userId,
        });
      } catch (error) {
        return c.text(\`Error inserting event: \${error}\`, 500);
      }
    },
  );
}`;
    it("should find the source handler function", async () => {
      const jsFilePath = path.join(testContentsDir, "index.js");
      const functionText = HANDLER_COMPILED_CODE;
      const result = await findSourceFunction(jsFilePath, functionText);

      expect(result).toBeDefined();
      expect(result).toEqual(HANDLE_SOURCE_CODE);
    });
  });

  describe("middleware", () => {
    const MIDDLEWARE_COMPILED_CODE =
      'async (c, next) => {\n    const secret = c.env.GITHUB_WEBHOOK_SECRET;\n    const webhooks2 = getWebhooksInstance(secret);\n    c.set("webhooks", webhooks2);\n    await next();\n    const id = c.req.header("x-github-delivery");\n    const signature = c.req.header("x-hub-signature-256");\n    const name = c.req.header("x-github-event");\n    if (!(id && name && signature)) {\n      return c.text("Invalid webhook request", 403);\n    }\n    const payload = await c.req.text();\n    try {\n      await webhooks2.verifyAndReceive({\n        id,\n        name,\n        signature,\n        payload\n      });\n      return c.text("Webhook received & verified", 201);\n    } catch (error) {\n      return c.text(`Failed to verify Github Webhook request: ${error}`, 400);\n    }\n  }';
    const MIDDLEWARE_SOURCE_CODE = `async (c, next) => {
    const secret = c.env.GITHUB_WEBHOOK_SECRET;
    const webhooks = getWebhooksInstance(secret);

    c.set("webhooks", webhooks);

    await next();

    const id = c.req.header("x-github-delivery");
    const signature = c.req.header("x-hub-signature-256");
    const name = c.req.header("x-github-event") as WebhookEventName;

    if (!(id && name && signature)) {
      return c.text("Invalid webhook request", 403);
    }

    const payload = await c.req.text();

    try {
      await webhooks.verifyAndReceive({
        id,
        name,
        signature,
        payload,
      });
      return c.text("Webhook received & verified", 201);
    } catch (error) {
      return c.text(\`Failed to verify Github Webhook request: \${error}\`, 400);
    }
  }`;

    it("should find the source middleware function", async () => {
      const jsFilePath = path.join(testContentsDir, "index.js");
      const functionText = MIDDLEWARE_COMPILED_CODE;
      const result = await findSourceFunction(jsFilePath, functionText);

      expect(result).toBeDefined();
      console.log(result);
      expect(result).toEqual(MIDDLEWARE_SOURCE_CODE);
    });
  });
});
