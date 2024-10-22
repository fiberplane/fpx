import { githubAuth } from "@hono/oauth-providers/github";
import { Hono } from "hono";
import * as jose from "jose";
import { initDbConnect } from "../db";
import { importKey, upsertUser } from "../lib";
import type { FpAuthApp } from "../types";
import success, { generateNonce, SuccessPage } from "./success";

const app = new Hono<FpAuthApp>();

/**
 * Set up OAuth middleware for GitHub
 */
app.use("/", (c, next) => {
  const handler = githubAuth({
    client_id: c.env.GITHUB_ID,
    client_secret: c.env.GITHUB_SECRET,
    scope: ["read:user", "user:email"],
    oauthApp: true,
  });
  const result = handler(c, next);
  return result;
});

/**
 * GitHub OAuth callback after logging in
 */
app.get("/", async (c) => {
  const db = initDbConnect(c.env.DB);

  // Get OAuth tokens from the context (not used in this implementation)
  const _token = c.get("token");
  const _refreshToken = c.get("refresh-token");

  // Get the authenticated GitHub user information
  const user = c.get("user-github");

  // Check if we have the required user information
  if (user?.login && user?.email) {
    // Upsert the user in the database
    const [userRecord] = await upsertUser(db, {
      githubUsername: user.login,
      email: user.email,
    });

    const privateKey = await importKey("private", c.env.PRIVATE_KEY);

    // Sign the JWT using the private key from environment variables
    // Create a JWT payload
    const userId = userRecord?.id;
    const payload = {
      // NOTE - Token expiration is set below
      sub: userId?.toString() ?? "anon", // Subject (user identifier)
      iat: Math.floor(Date.now() / 1000), // Issued at (current timestamp)
      nbf: Math.floor(Date.now() / 1000), // Not before (current timestamp)
    };

    // HACK - Temporary workaround to communicate expiration to the client
    //        I am being lazy
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "PS256" })
      .setExpirationTime("7d")
      .sign(privateKey);

    const nonce = generateNonce(); // Generate a unique nonce for each request

    // Set CSP header
    c.header("Content-Security-Policy", `script-src 'nonce-${nonce}'`);

    return c.render(<SuccessPage nonce={nonce} token={token} expiresAt={expiresAt} />);
  }

  // If no user information is available, return an error message
  return c.text("Error: No user information", 500);
});

export default app;
