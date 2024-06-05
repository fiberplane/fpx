import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';
import { DEFAULT_DATABASE_URL } from './src/constants.js';

// Set the environment vars
config({ path: '.dev.vars' });

// We need a fallback for the database url if none is specified
// This fallback should be the same as in the Hono app
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
const sql = createClient({ url: databaseUrl });
const db = drizzle(sql);

const getMigrationsFolder = (): string => {
  const possiblePaths = [
    path.resolve(__dirname, 'drizzle'),
    path.resolve(__dirname, '../drizzle')
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  throw new Error('Migrations folder not found in the expected locations.');
};

const main = async () => {
  try {
    const migrationsFolder = getMigrationsFolder();
    await migrate(db, { migrationsFolder });
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();