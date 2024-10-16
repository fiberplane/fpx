import { log } from "@clack/prompts";

export function showD1SetupInstructions() {
  log.step("Setting up D1:");
  log.step("local development: Wrangler can spin up a D1 database locally");

  log.step(`production: Create a Cloudflare account and D1 instance, retrieve the database key and your account id from the dashboard and addionally create an API token with D1 edit rights, and add it to your .prod.vars file.

    CLOUDFLARE_D1_TOKEN=""
    CLOUDFLARE_ACCOUNT_ID=""
    CLOUDFLARE_DATABASE_ID=""

    `);
  log.step("visit https://developers.cloudflare.com/d1/ for more information");
}
