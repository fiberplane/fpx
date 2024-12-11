import { Hono } from "hono";
import { dashboardAuthentication } from "../../lib/session-auth";
import type { AppType } from "../../types";

const router = new Hono<AppType>();

router.use(dashboardAuthentication);

router.get("/", (c) => {
  return c.html(
    <div>
      Hello World - You are logged in as {c.get("currentUser")?.githubUsername}
    </div>,
  );
});

export { router as dashboardRouter };
