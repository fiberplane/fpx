import { Hono } from "hono";
import logger from "../logger/index.js";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "../lib/types.js";
import { getSupabaseManagementClient } from "../lib/integrations/supabase.js";
import { createServerClient } from "@supabase/ssr";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v0/integrations/supabase/users", cors(), async (ctx) => {
  const db = ctx.get("db");
  // FIXME: hardcoded the project id for now
  const projectId = "hmrijompfadwlebqmqia";

  const managementClient = await getSupabaseManagementClient(db);
  if (!managementClient) {
    return ctx.json({ error: "No Supabase API key set" }, 403);
  }
  const apiKeys = await managementClient.getProjectApiKeys(projectId);

  if (!apiKeys) {
    return ctx.json({ error: "No API keys found" }, 404);
  }

  const serviceKey = apiKeys.find((key) => key.name === "service_role");

  if (!serviceKey) {
    return ctx.json({ error: "No service key found" }, 404);
  }

  // const adminClient = createClient(
  //   `https://${projectId}.supabase.co`,
  //   serviceKey.api_key,
  // ).auth.admin;
  const adminClient = createServerClient(
    `https://${projectId}.supabase.co`,
    serviceKey.api_key,
    {
      cookies: {

        // set: (key, value, options) => {
        //   setCookie(ctx, key, value, options);
        // },
        // remove: (key, options) => {
        //   deleteCookie(ctx, key, options);
        // },
      },
      cookieOptions: {
        httpOnly: true,
        secure: true,
      },
    },
  );

  const { data: usersData, error } = await adminClient.listUsers({
    perPage: 100,
  });
  const users = usersData?.users || [];

  if (error) {
    return ctx.json({ error: error.message }, 500);
  }

  const generatedLinks = await Promise.all(
    users.map((user) =>
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      adminClient.generateLink({ email: user.email!, type: "magiclink" }),
    ),
  );

  const links = generatedLinks.map((link) => link.data.properties?.action_link);
  logger.debug("links", links);
  return ctx.json({ links });
});

export default app;
