import fs from "node:fs";
import path from "node:path";
import { SupabaseManagementAPI } from "supabase-management-js";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import { getSetting } from "../settings/index.js";
import { USER_PROJECT_ROOT_DIR } from "../../constants.js";
import logger from "../../logger/index.js";

let managementClient: SupabaseManagementAPI | null = null;

const POSSIBLE_ENV_FILES = [
  ".dev.vars",
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
];

export async function getSupabaseManagementClient(
  db: LibSQLDatabase<typeof schema>,
) {
  const supabaseApiKey = await getSetting(db, "supabaseApiKey");

  if (!supabaseApiKey) {
    return null;
  }

  if (!managementClient) {
    managementClient = new SupabaseManagementAPI({
      accessToken: supabaseApiKey,
    });
  }

  return managementClient;
}

/**
 * Extracts project ID from a Supabase URL using the URL constructor
 * Handles URLs in formats:
 * - https://<project-id>.supabase.co
 * - http://<project-id>.supabase.co
 */
function extractProjectId(urlString: string): string | null {
  try {
    // Ensure URL has a protocol
    const urlWithProtocol = urlString.startsWith("http")
      ? urlString
      : `https://${urlString}`;

    const url = new URL(urlWithProtocol);

    // Verify it's a Supabase URL
    if (!url.hostname.endsWith(".supabase.co")) {
      return null;
    }

    // Get the subdomain (project ID)
    const projectId = url.hostname.split(".")[0];
    return projectId || null;
  } catch (error) {
    console.error("Invalid Supabase URL:", error);
    return null;
  }
}

/**
 * Finds and parses Supabase URL from environment files
 * Handles formats:
 * - SUPABASE_URL=value
 * - SUPABASE_URL="value"
 * - SUPABASE_URL='value'
 * - export SUPABASE_URL=value
 */
function parseEnvFile(content: string): string | null {
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Remove 'export' if present
    const withoutExport = trimmedLine.replace(/^export\s+/, "");

    // Check if line starts with SUPABASE_URL
    if (!withoutExport.startsWith("SUPABASE_URL=")) {
      continue;
    }

    // Get everything after the equals sign
    const value = withoutExport.substring("SUPABASE_URL=".length);

    // Remove surrounding quotes if present
    return value.replace(/^["']|["']$/g, "").trim();
  }

  return null;
}

export async function discoverSupabaseProjectId() {
  try {
    for (const fileName of POSSIBLE_ENV_FILES) {
      const filePath = path.join(USER_PROJECT_ROOT_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        continue;
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const supabaseUrl = parseEnvFile(fileContent);

      if (supabaseUrl) {
        const projectId = extractProjectId(supabaseUrl);
        if (projectId) {
          return projectId;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error(
      "Failed to extract Supabase project ID from environment files:",
      error,
    );
    return null;
  }
}
