import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Context } from "@/context";
import { getScaffoldedFiles, shouldSkipCodeGen } from "@/integrations/code-gen";
import { SuperchargerError } from "@/types";
import { spinner } from "@clack/prompts";

/**
 * Start the supercharger request in the background.
 * We save it as a promise so we can await the result later, in `actionSuperchargerFinish`.
 *
 * @param ctx - The context object.
 */
export async function actionCodeGenStart(ctx: Context) {
  if (shouldSkipCodeGen(ctx)) {
    return;
  }

  ctx.superchargerPromise = getScaffoldedFiles(ctx);
}

export async function actionCodeGenFinish(ctx: Context) {
  if (shouldSkipCodeGen(ctx)) {
    return;
  }

  const s = spinner();
  s.start("Generating code from project description...");

  try {
    const scaffoldedFiles = await ctx.superchargerPromise;

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
