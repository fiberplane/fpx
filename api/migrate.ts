import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { drizzle } from 'drizzle-orm/libsql';

config({ path: '.dev.vars' });

const databaseUrl = process.env.DATABASE_URL ?? 'file:mizu.db';
const sql = createClient({
  url: databaseUrl
})
const db = drizzle(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migration complete');
  } catch (e) {
    // HACK - if we are running from `dist` folder, need to search one level up for migrations...
    const parentPath = path.resolve(__dirname, '../', 'drizzle');
    const parentPathExists = fs.existsSync(parentPath)
    if (parentPathExists) {
      try {
        await migrate(db, { migrationsFolder: parentPath });
        console.log('Migration complete');
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log(e);
    }
  }
  process.exit(0);
};

main();