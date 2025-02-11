import { createServer } from "node:http";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import chalk from "chalk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FPX_AUTH_SERVER_PORT } from "../../constants.js";
import rootLogger from "../../logger/index.js";
import { TokenPayloadSchema } from "./types.js";

const logger = rootLogger.withTag("auth-server");
type AuthServer = ReturnType<typeof serve>;

let currentAuthServer: null | AuthServer = null;

/**
 * Returns the currently active authentication server.
 * Otherwise, initializes an authentication server.
 *
 * @INVESTIGATE - How can we recover if there's a clashing or crufty process?
 */
export async function getAuthServer(fpxStudioPort: number) {
  if (!currentAuthServer) {
    currentAuthServer = await serveAuth(fpxStudioPort);
  }

  return currentAuthServer;
}

/**
 * Helper for closing the currently running authentication server
 */
export async function closeAuthServer() {
  if (currentAuthServer) {
    currentAuthServer.close(() => {
      currentAuthServer = null;
    });
  }
}

/**
 * Spin up a small authentication server on a known port,
 * in order to receive the user's JWT from the external Fiberplane service.
 *
 * @param fpxStudioPort - The port on which the Studio API is running
 */
export function serveAuth(fpxStudioPort: number): Promise<AuthServer> {
  return new Promise((resolve, reject) => {
    try {
      const app = createAuthApp(fpxStudioPort);

      logger.debug(chalk("[auth-server] Initializing"));

      const server = serve({
        fetch: app.fetch,
        port: FPX_AUTH_SERVER_PORT,
        createServer,
      }) as ReturnType<typeof createServer>;

      // Resolve the promise when the server is listening
      server.on("listening", () => {
        logger.debug(
          chalk.dim(
            `Auth server listening on http://localhost:${FPX_AUTH_SERVER_PORT}`,
          ),
        );
        resolve(server);
      });

      // Reject the promise if there's an error
      server.on("error", (err) => {
        currentAuthServer = null;
        if ("code" in err && err.code === "EADDRINUSE") {
          logger.error(
            `Port ${FPX_AUTH_SERVER_PORT} is already in use. Please choose a different port for FPX.`,
          );
        } else {
          logger.error("Auth server error:", err);
        }

        // FIXME - The server may have already been listening, so
        //         this could be bad news bears and lead to warnings in the console
        //         that the promise already resolved.
        reject(err);
      });

      // Remove reference to `currentAuthServer` if the server closes
      // TODO - Investigate if this is necessary
      server.on("close", () => {
        currentAuthServer = null;
      });
    } catch (error) {
      rootLogger.error("Failed to create authentication server", error);
      reject(error);
    }
  });
}

/**
 * Factory that creates a Hono app that can handle auth success payloads
 * and forward them to the main Studio API
 *
 * @param fpxPort - The port on which the Studio API is running
 */
function createAuthApp(fpxStudioPort: number) {
  const app = new Hono();

  // Set up CORS middleware
  app.use(
    "/v0/auth/success",
    cors({
      // HACK - Trust the local auth service while testing by default
      origin: [
        "http://127.0.0.1:3578",
        "http://localhost:3578",
        "https://fp-services.mies.workers.dev",
      ],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
      exposeHeaders: ["Content-Length"],
    }),
  );

  app.post(
    "/v0/auth/success",
    zValidator("json", TokenPayloadSchema),
    async (c) => {
      const { token, expiresAt } = c.req.valid("json");
      try {
        const success = await reportTokenToStudio(
          fpxStudioPort,
          token,
          expiresAt,
        );
        if (success) {
          return c.text("OK");
        }
        return c.text("Unknown error", 500);
      } catch (error) {
        logger.error("Spooky error reporting token to Studio", error);
        return c.text("Unknown error", 500);
      }
    },
  );

  return app;
}

/**
 * Helper function for reporting the JWT to the Studio API.
 *
 * @param fpxPort - The port on which the Studio API is running
 * @param token - The user's JWT
 * @returns - true if we successfully reported the token to Studio, false otherwise
 */
async function reportTokenToStudio(
  fpxStudioPort: number,
  token: string,
  expiresAt: string,
) {
  const localApiUrl = `http://localhost:${fpxStudioPort}/v0/auth/success`;
  const response = await fetch(localApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, expiresAt }),
  });

  if (!response.ok) {
    logger.error(
      "Failed to POST auth data to Studio API:",
      response.statusText,
    );
    return false;
  }

  logger.debug(
    chalk.green("Auth server successfully POSTed token to Studio API"),
  );
  return true;
}
