import http from "node:http";
import { URL } from "node:url";
import chalk from "chalk";
import logger from "../../logger.js";

/**
 * Verify a token with the authentication API
 * @param token The token to verify
 * @returns A promise that resolves to the verification result
 */
export async function verifyToken(token: string): Promise<unknown> {
  const baseUrl = process.env.FPX_AUTH_BASE_URL;
  if (!baseUrl) {
    throw new Error("FPX_AUTH_BASE_URL environment variable is not set");
  }

  const url = new URL("/verify", baseUrl);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const verifiedToken = await response.json();
    return verifiedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
}

/**
 * Start an ephemeral web server to handle authentication success.
 * This ephemeral server will be responsible for forwarding a JWT to the Studio API
 *
 * @param fpxStudioPort The port number of the local FPX Studio API
 * @param callback Function to call with the received data
 * @returns An interface for controlling the server
 */
export function startAuthServer(
  fpxStudioPort: number,
  callback: (data: unknown) => void,
): AuthServer {
  logger.debug(chalk.dim("[debug] Initializing auth server..."));

  let requestCompleteCallback: (() => void) | null = null;
  const server = http.createServer((req, res) => {
    if (req.url?.startsWith("/github/auth/success")) {
      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type");
      // res.setHeader('Access-Control-Allow-Credentials', "true");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Authentication successful. You can close this window.");

        try {
          const data = JSON.parse(body);
          callback(data);

          // Send the authentication data to the local API
          const localApiUrl = `http://localhost:${fpxStudioPort}/v0/auth/success`;
          const response = await fetch(localApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            /** { token: "..." } */
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            logger.error(
              "Failed to send auth data to local API:",
              response.statusText,
            );
          } else {
            logger.debug(
              chalk.green(
                "Auth server successfully POSTed token to Studio API",
              ),
            );
          }
        } catch (error) {
          logger.error("Error processing authentication data:", error);
        }

        requestCompleteCallback?.();
      });
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });

  server.listen(3579, "localhost", () => {
    logger.debug("Auth server listening on http://localhost:3579");
  });

  return {
    close: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
    onRequestComplete: (callback: () => void) => {
      requestCompleteCallback = callback;
    },
  };
}

interface AuthServer {
  close: () => Promise<void>;
  onRequestComplete: (callback: () => void) => void;
}
