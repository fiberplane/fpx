import type { Context } from "@/context";
import type { Template } from "@/types";
import { log, select, spinner } from "@clack/prompts";
import { downloadTemplate } from "giget";

export async function promptTemplate(ctx: Context) {
  try {
    const result = await select({
      message: "Which template do you want to use?",
      options: [
        {
          value: "base",
          label: "Base template",
          hint: "A barebones HONC project with a Neon database",
        },
        {
          value: "base-supa",
          label: "(Supa)base template",
          hint: "A barebones HONC project with a Supabase database",
        },
        {
          value: "sample-api",
          label: "Sample API template",
          hint: "A configured sample API using the HONC stack",
        },
        {
          value: "sample-d1",
          label: "D1 base template",
          hint: "A barebones HONC project with a D1 Database",
        },
      ],
      initialValue: "base",
    });

    if (typeof result === "string") {
      ctx.template = result as Template;
    }

    return result;
  } catch (error) {
    return error;
  }
}

export async function actionTemplate(ctx: Context) {
  if (!ctx.path) {
    log.error("Path is required");
    process.exit(1);
  }

  const s = spinner();
  s.start("Setting up template...");

  let templateUrl: string;

  switch (ctx.template) {
    case "sample-api":
      templateUrl = "github:fiberplane/goose-quotes";
      break;
    case "base":
      templateUrl = "github:fiberplane/create-honc-app/templates/base";
      break;
    case "base-supa":
      templateUrl = "github:fiberplane/create-honc-app/templates/base-supa";
      break;
    case "sample-d1":
      templateUrl = "github:fiberplane/create-honc-app/templates/d1";
      break;
    default:
      return new Error(`Invalid template selected: ${ctx.template}`);
  }

  try {
    await downloadTemplate(templateUrl, {
      cwd: ctx.cwd,
      dir: ctx.path,
      force: true,
      provider: "github",
    });
  } catch (error) {
    return error;
  }

  s.stop();
  log.success("Template set up successfully");
  return;
}
