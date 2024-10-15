import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Context } from "@/context";
import { getScaffoldedFiles } from "@/integrations/supercharger/supercharger";
import { SuperchargerError } from "@/types";
import { spinner } from "@clack/prompts";

export async function actionSupercharger(ctx: Context) {
  const s = spinner();
  s.start("Setting up supercharger...");

  try {
    const scaffoldedFiles = await getScaffoldedFiles(ctx);

    if (scaffoldedFiles) {
      const currentPath = ctx.path ?? ".";
      if (scaffoldedFiles.indexFile) {
        writeFileSync(
          path.join(currentPath, "src", "index.ts"),
          scaffoldedFiles.indexFile,
        );
      }
      if (scaffoldedFiles.schemaFile) {
        writeFileSync(
          path.join(currentPath, "src", "db", "schema.ts"),
          scaffoldedFiles.schemaFile,
        );
      }
      if (scaffoldedFiles.seedFile) {
        writeFileSync(
          path.join(currentPath, "seed.ts"),
          scaffoldedFiles.seedFile,
        );
      }
    }

    s.stop();
    return;
  } catch (error) {
    s.stop();
    return new SuperchargerError(
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
