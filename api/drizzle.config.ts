import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.dev.vars' });

export default {
  schema: './src/db/schema.ts',
  out: 'drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: we want this to fail if not defined
    url: process.env.DATABASE_URL!,
  }
} satisfies Config;