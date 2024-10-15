import { log } from "@clack/prompts";

export function showSupabaseSetupInstructions() {
  log.step("Setting up Supabase:");
  log.step(`Create a Supabase account and project, retrieve the connection key from the dashboard, and add it to your .dev.vars file.

DATABASE_URL=postgres://....
`);
  log.step(
    "Visit https://supabase.com/docs/guides/database/connecting-to-supabase to create an account and project.",
  );
}
