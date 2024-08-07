import fs from "node:fs";
import path from "node:path";
import { minimatch } from "minimatch";
import logger from "../logger.js";

/**
 * Hacky helper in case you want to try parsing a message as json, but want to fall back to its og value
 */
export function tryParseJsonObjectMessage(str: unknown) {
  if (typeof str !== "string") {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

/**
 * Quick and dirty uuid utility
 */
export function generateUUID() {
  const timeStamp = new Date().getTime().toString(36);
  const randomPart = () => Math.random().toString(36).substring(2, 15);
  return `${timeStamp}-${randomPart()}-${randomPart()}`;
}

export function errorToJson(error: Error) {
  return {
    name: error.name, // Includes the name of the error, e.g., 'TypeError'
    message: error.message, // The message string of the error
    stack: error.stack ?? "", // Stack trace of where the error occurred (useful for debugging)
    // Optionally add more properties here if needed
  };
}

export function shouldIgnoreFile(
  filename: string | null,
  ignoredPaths: string[],
): boolean {
  return (
    !filename ||
    ignoredPaths.some(
      (pattern) =>
        // E.g., ignore everything inside the `.wrangler` directory
        filename.startsWith(`${pattern}${path.sep}`) ||
        // E.g., ignore all files with the given name (e.g., `fpx.db`, `.fpxconfig/fpx.db`)
        path.basename(filename) === pattern ||
        // E.g., ignore all files that match the given pattern (e.g., *.db`, `*.db-journal`)
        minimatch(filename, pattern),
    )
  );
}

export function getIgnoredPaths() {
  const defaultIgnoredPaths = [
    ".git",
    "node_modules",
    "dist",
    "out",
    "fpx.db",
    "fpx.db-journal",
    "mizu.db",
    "mizu.db-journal",
    ".fpx",
    ".fpxconfig",
    ".swc",
    ".wrangler",
  ];

  try {
    const currentDir = process.cwd();
    const paths = fs.readdirSync(currentDir, { withFileTypes: true });
    const gitignoreFiles = paths.filter((path) => path.name === ".gitignore");

    const gitignoredPaths = gitignoreFiles.map((gitignoreFile) => {
      const filePath = path.join(currentDir, gitignoreFile.name);
      const content = fs.readFileSync(filePath, "utf8");
      return (
        content
          .split("\n")
          .filter((line) => line.trim() !== "")
          // Filter out comments
          .filter((line) => !line.startsWith("#"))
          // Filter out negations, since we're using minimatch on a per-pattern basis
          // so, `!.yarn/releases` would match like all files
          .filter((line) => !line.startsWith("!"))
      );
    });

    return defaultIgnoredPaths.concat(...gitignoredPaths.flat());
  } catch (error) {
    console.error("Error reading .gitignore files", error);
    return defaultIgnoredPaths;
  }
}

export function safeParseJson(str: string | null | undefined) {
  if (!str) {
    return null;
  }
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export async function safeReadTextBody(response: Response) {
  return response.text().catch((error) => {
    logger.error("Failed to parse response body", error);
    return null;
  });
}

export function resolveUrlQueryParams(
  url: string,
  queryParams?: Record<string, string> | null,
) {
  if (!queryParams) return url;

  const urlObject = new URL(url);
  for (const [key, value] of Object.entries(queryParams)) {
    urlObject.searchParams.set(key, value);
  }
  return urlObject.toString();
}

/**
 * Simple utility function to resolve the Webhonc service URL with default values
 *
 * Note: it will always return just the host, a string without the protocol, path
 * or port, e.g. webhonc.mies.workers.dev
 */
export function resolveWebhoncUrl() {
   const fallbackUrl = "webhonc.mies.workers.dev";
  if (!process.env.FPX_WEBHONC_BASE_URL) return fallbackUrl;
  const customUrl = new URL(process.env.FPX_WEBHONC_BASE_URL);
  return customUrl.host;
}
