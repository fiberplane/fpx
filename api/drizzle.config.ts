import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://bugz_owner:FH70RLTDmixu@ep-spring-glitter-a2vyz3ob.eu-central-1.aws.neon.tech/traces?sslmode=require",
  },
} satisfies Config;
