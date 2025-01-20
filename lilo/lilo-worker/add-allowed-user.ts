import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import {
  type LibSQLDatabase,
  drizzle as drizzleLibsql,
} from "drizzle-orm/libsql";
// import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import {
  type AsyncBatchRemoteCallback,
  type AsyncRemoteCallback,
  type SqliteRemoteDatabase,
  drizzle as drizzleSQLiteProxy,
} from "drizzle-orm/sqlite-proxy";

import * as schema from "./src/db/schema";

// biome-ignore lint/suspicious/noExplicitAny: Centralize usage of `any` type (we use it in db results that are not worth typing)
type Any = any;

addAllowedUser();

async function addAllowedUser() {
  const db =
    process.env.ENVIRONMENT === "production"
      ? await getProductionDatabase()
      : await getLocalDatabase();

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("No usernames provided");
    process.exit(1);
  }

  console.log("Adding allowed users:", args.join(", "));

  for (const githubUsername of args) {
    await db.insert(schema.allowedUsers).values({
      githubUsername,
    });
  }
}

/**
 * Creates a connection to the local D1 SQLite database and returns a Drizzle ORM instance.
 * @returns {Promise<LibSQLDatabase>} Drizzle ORM instance connected to local database
 * @throws {Error} If local database path cannot be resolved
 */
async function getLocalDatabase(): Promise<
  LibSQLDatabase<Record<string, never>>
> {
  console.log("Using local SQLite database");
  const dbPath = getLocalSQLiteDBPath();

  if (!dbPath) {
    console.error("Database seed failed: local DB could not be resolved");
    process.exit(1);
  }

  const client = createClient({
    url: `file:${dbPath}`,
  });

  return drizzleLibsql(client);
}

/**
 * Creates a connection to the production Cloudflare D1 database and returns a Drizzle ORM instance.
 * Loads production environment variables from .prod.vars file.
 * @returns {Promise<SqliteRemoteDatabase>} Drizzle ORM instance connected to production database
 * @throws {Error} If required environment variables are not set
 */
async function getProductionDatabase(): Promise<
  SqliteRemoteDatabase<Record<string, never>>
> {
  console.warn("Using production D1 database");
  config({ path: ".prod.vars" });

  const apiToken = process.env.CLOUDFLARE_D1_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;

  if (!apiToken || !accountId || !databaseId) {
    console.error(
      "Database seed failed: production environment variables not set (make sure you have a .prod.vars file)",
    );
    process.exit(1);
  }

  return createProductionD1Connection(accountId, databaseId, apiToken);
}

/**
 * Creates a connection to a remote Cloudflare D1 database using the sqlite-proxy driver.
 * @param {string} accountId - Cloudflare account ID
 * @param {string} databaseId - D1 database ID
 * @param {string} apiToken - Cloudflare API token with write access to D1
 * @returns {SqliteRemoteDatabase} Drizzle ORM instance connected to remote database
 */
export function createProductionD1Connection(
  accountId: string,
  databaseId: string,
  apiToken: string,
) {
  /**
   * Executes a single query against the Cloudflare D1 HTTP API.
   *
   * @param {string} accountId - Cloudflare account ID
   * @param {string} databaseId - D1 database ID
   * @param {string} apiToken - Cloudflare API token with write access to D1
   * @param {string} sql - The SQL statement to execute
   * @param {any[]} params - Parameters for the SQL statement
   * @param {string} method - The method type for the SQL operation
   * @returns {Promise<{ rows: any[][] }>} The result rows from the query
   * @throws {Error} If the HTTP request fails or returns an error
   */
  async function executeCloudflareD1Query(
    accountId: string,
    databaseId: string,
    apiToken: string,
    sql: string,
    params: Any[],
    method: string,
  ): Promise<{ rows: Any[][] }> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params, method }),
    });

    const data: Any = await res.json();

    if (res.status !== 200) {
      throw new Error(
        `Error from sqlite proxy server: ${res.status} ${res.statusText}\n${JSON.stringify(data)}`,
      );
    }

    if (data.errors.length > 0 || !data.success) {
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}}`,
      );
    }

    const qResult = data?.result?.[0];

    if (!qResult?.success) {
      throw new Error(
        `Error from sqlite proxy server: \n${JSON.stringify(data)}`,
      );
    }

    return { rows: qResult.results.map((r: Any) => Object.values(r)) };
  }

  /**
   * Asynchronously executes a single query.
   */
  const queryClient: AsyncRemoteCallback = async (sql, params, method) => {
    return executeCloudflareD1Query(
      accountId,
      databaseId,
      apiToken,
      sql,
      params,
      method,
    );
  };

  /**
   * Asynchronously executes a batch of queries.
   */
  const batchQueryClient: AsyncBatchRemoteCallback = async (queries) => {
    const results: { rows: Any[][] }[] = [];

    for (const query of queries) {
      const { sql, params, method } = query;
      const result = await executeCloudflareD1Query(
        accountId,
        databaseId,
        apiToken,
        sql,
        params,
        method,
      );
      results.push(result);
    }

    return results;
  };

  return drizzleSQLiteProxy(queryClient, batchQueryClient);
}

/**
 * Used when connecting to local SQLite db during seeding and migrations,
 * or when making queries against the db.
 * @returns Path to most recent .sqlite file in the .wrangler directory
 */
function getLocalSQLiteDBPath() {
  try {
    // .wrangler dir and process execution are assumed to be colocated
    const basePath = path.resolve(".wrangler");

    const files = fs
      .readdirSync(basePath, {
        encoding: "utf-8",
        recursive: true,
      })
      .filter((fileName) => fileName.endsWith(".sqlite"));

    if (!files.length) {
      throw new Error(`No .sqlite file found at ${basePath}`);
    }

    // Retrieve most recent .sqlite file
    files.sort((a, b) => {
      const statA = fs.statSync(path.join(basePath, a));
      const statB = fs.statSync(path.join(basePath, b));

      return statB.mtime.getTime() - statA.mtime.getTime();
    });

    return path.resolve(basePath, files[0]);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error resolving local D1 DB: ${error.message}`, {
        cause: error,
      });
    }

    throw new Error("Error resolving local D1 DB", { cause: error });
  }
}
