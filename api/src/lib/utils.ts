import fs from "node:fs";
import path from "node:path";
import type { Context } from "hono";
import { minimatch } from "minimatch";
import { type Schema, any } from "zod";
import logger from "../logger.js";

export function isJson(str: unknown) {
  if (typeof str !== "string") {
    return false;
  }
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

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

// biome-ignore lint/suspicious/noExplicitAny: We handle the any case well enough
export function fallback<T extends Schema<any>, U>(
  schema: T,
  valueOrFn: U | (() => U),
): T | Schema<U> {
  return any().transform((val) => {
    const safe = schema.safeParse(val);
    if (safe.success) {
      return safe.data;
    }
    if (typeof valueOrFn === "function") {
      return (valueOrFn as () => U)();
    }
    return valueOrFn;
  });
}

export async function safeReadTextBody(response: Response) {
  return tryGetResponseBodyAsText(response).catch((error) => {
    logger.error("Failed to parse response body", error);
    return null;
  });
}

// NOTE - Copy-pasted from client-library-otel
async function tryGetResponseBodyAsText(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("image/")) {
    return "#fpx.image";
  }
  if (contentType?.includes("application/pdf")) {
    return "#fpx.pdf";
  }
  if (contentType?.includes("application/zip")) {
    return "#fpx.zip";
  }
  if (contentType?.includes("audio/")) {
    return "#fpx.audio";
  }
  if (contentType?.includes("video/")) {
    return "#fpx.video";
  }
  if (
    contentType?.includes("application/octet-stream") ||
    contentType?.includes("application/vnd.ms-excel") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ) ||
    contentType?.includes("application/vnd.ms-powerpoint") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ) ||
    contentType?.includes("application/msword") ||
    contentType?.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  ) {
    return "#fpx.binary";
  }

  return await response.text();
}

export type SerializedFile = {
  name: string;
  type: string;
  size: number;
};

/**
 * Helper that serializes the request body into a format that can be stored in the database
 *
 * This will *not* store binary data, for example, like File objects
 */
export async function serializeRequestBodyForFpxDb(ctx: Context) {
  const contentType = ctx.req.header("content-type");
  const requestMethod = ctx.req.method;
  let requestBody:
    | null
    | string
    | {
        [x: string]: string | SerializedFile | (string | SerializedFile)[];
      } = null;
  if (ctx.req.raw.body) {
    if (requestMethod === "GET" || requestMethod === "HEAD") {
      logger.warn(
        "Request method is GET or HEAD, but request body is not null",
      );
      requestBody = null;
    } else if (contentType?.includes("application/json")) {
      // NOTE - This kind of handles the case where the body is note valid json,
      //        but the content type is set to application/json
      const textBody = await ctx.req.text();
      requestBody = safeParseJson(textBody);
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await ctx.req.formData();
      requestBody = {};
      // @ts-expect-error - MDN says formData does indeed have an entries method :thinking_face:
      for (const [key, value] of formData.entries()) {
        requestBody[key] = value;
      }
    } else if (contentType?.includes("multipart/form-data")) {
      // NOTE - `File` will just show up as an empty object in sqllite - could be nice to record metadata?
      //         like the name of the file
      const formData = await ctx.req.parseBody({ all: true });
      requestBody = {};
      for (const [key, value] of Object.entries(formData)) {
        if (Array.isArray(value)) {
          requestBody[key] = value.map(serializeFormDataValue);
        } else {
          requestBody[key] = serializeFormDataValue(value);
        }
      }
    } else if (contentType?.includes("application/octet-stream")) {
      requestBody = "<binary data>";
    } else {
      requestBody = await ctx.req.text();
    }
  }

  return requestBody;
}

function serializeFile(file: File): SerializedFile {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

function serializeFormDataValue(
  value: FormDataEntryValue,
): string | SerializedFile {
  if (value instanceof File) {
    return serializeFile(value);
  }
  return value;
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
