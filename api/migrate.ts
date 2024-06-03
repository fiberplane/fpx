import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';

config({ path: '.dev.vars' });

const databaseUrl = process.env.DATABASE_URL ?? "file:mizu.db";
const sql = createClient({
  url: databaseUrl
})
const db = drizzle(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration complete');
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
};

main();