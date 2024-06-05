import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config({ path: ".dev.vars" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not defined");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
const sql = createClient({
  url: databaseUrl,
});
const db = drizzle(sql);

const main = async () => {
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migration complete");
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
};

main();
