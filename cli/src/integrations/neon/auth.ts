import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { log } from "@clack/prompts";
import open from "open";
import {
  OAuth2Client,
  type TokenResponseBody,
  generateCodeVerifier,
  generateState,
} from "oslo/oauth2";

const NEON_OAUTH_HOST = "https://oauth2.neon.tech";
const NEON_CLIENT_ID = "create-honc-app";
const NEON_SCOPES = [
  "openid",
  "offline",
  "offline_access",
  "urn:neoncloud:projects:read",
  "urn:neoncloud:projects:create",
  "urn:neoncloud:projects:update",
];
const AUTH_TIMEOUT_MS = 200000;
const REDIRECT_URI = (port: number) => `http://127.0.0.1:${port}/callback`;

export async function getNeonAuthToken(): Promise<TokenResponseBody> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const listenPort = (server.address() as AddressInfo).port;

  const client = new OAuth2Client(
    NEON_CLIENT_ID,
    `${NEON_OAUTH_HOST}/oauth2/auth`,
    `${NEON_OAUTH_HOST}/oauth2/token`,
    { redirectURI: REDIRECT_URI(listenPort) },
  );

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const authorizationURL = await client.createAuthorizationURL({
    state,
    codeVerifier,
    codeChallengeMethod: "S256",
    scopes: NEON_SCOPES,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `Authentication timed out after ${AUTH_TIMEOUT_MS / 1000} seconds`,
        ),
      );
    }, AUTH_TIMEOUT_MS);

    server.on("request", async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end();
        return;
      }

      const url = new URL(req.url, REDIRECT_URI(listenPort));
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      if (returnedState !== state) {
        reject(new Error("State mismatch"));
        return;
      }

      if (code) {
        try {
          const token = await client.validateAuthorizationCode(code, {
            codeVerifier,
          });
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<code>Authentication with create-honc-app successful! You can close this window.</code>",
          );
          clearTimeout(timer);
          resolve(token);
          server.close();
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("No code received"));
      }
    });

    log.step(`Awaiting authentication in web browser. Auth URL: 

${authorizationURL.toString()}`);

    open(authorizationURL.toString()).catch((_err: unknown) => {
      log.error(
        "Failed to open web browser. Please copy & paste auth url to authenticate in browser.",
      );
    });
  });
}
