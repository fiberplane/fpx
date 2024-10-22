import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { ERROR_TYPE_NOT_FOUND, ERROR_TYPE_UNAUTHORIZED } from "./constants";
import { fpAuthenticate } from "./lib";
import ai from "./routes/ai";
import github from "./routes/github";
// import success from "./routes/success";
import type { FpAuthApp } from "./types";

const app = new Hono<FpAuthApp>();

/** GitHub auth routing */
app.route("/github", github);

/** Ai services */
app.route("/ai", ai);

// TODO - REMOVE ME! This is here for testing the hacky UI on the success page
// app.route("/success", success);

/**
 * Return currently logged in user.
 * I.e., user associated with a given JWT.
 */
app.get("/user", fpAuthenticate, async (c) => {
  const verifiedToken = c.get("verifiedToken");
  if (!verifiedToken) {
    return c.json(
      { errorType: ERROR_TYPE_UNAUTHORIZED, message: "Unauthorized" },
      401,
    );
  }

  const user = c.get("currentUser");
  if (!user) {
    return c.json(
      { errorType: ERROR_TYPE_NOT_FOUND, message: "Not found" },
      404,
    );
  }

  return c.json({
    ...user,
    exp: verifiedToken.exp,
  });
});

export default instrument(app);
