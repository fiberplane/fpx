import { apiReference } from "@scalar/hono-api-reference";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import * as schema from "../db/schema";
import { addCurrentUserToContext } from "../lib/session-auth";
import type { AppType } from "../types";

const app = new Hono<AppType>();

app.get("/", addCurrentUserToContext, async (c, next) => {
  let apiKey = "";
  const db = c.get("db");
  const currentUser = c.get("currentUser");
  if (currentUser) {
    apiKey =
      (await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.userId, currentUser.id))
        .then((res) => res[0]?.key)) ?? "";
  }

  const reference = apiReference({
    spec: {
      url: "/doc", // URL to your OpenAPI specification
    },
    // Optional: choose a theme like 'default', 'moon', 'purple', etc.
    theme: "purple",
    pageTitle: "Lilo API Reference",
    authentication: {
      http: {
        // NOTE - Need to specify basic, even though we don't use it
        basic: {
          username: "",
          password: "",
        },
        bearer: {
          token: apiKey,
        },
      },
    },
  });

  // @ts-expect-error - TODO: fix this to incorporate the variables set by the scalar middleware
  return reference(c, next);
});

export { app as apiReferenceRouter };
