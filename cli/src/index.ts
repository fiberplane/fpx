#!/usr/bin/env node
import { getContext } from "./context";
import { promptPath } from "@/actions/path";
import { promptTemplate, actionTemplate } from "@/actions/template";
import { promptDatabase, actionDatabase } from "./actions/database";
import { promptDependencies, actionDependencies } from "./actions/dependencies";
import { promptGit, actionGit } from "./actions/git";
import pico from "picocolors";
import { intro, outro, isCancel } from "@clack/prompts";
import { HONC_TITLE } from "./const";
import { handleCancel, handleError } from "./utils";
import { promptDescription } from "./actions/description";

async function main() {
  console.log("");
  console.log(pico.red(HONC_TITLE));
  console.log("");

  intro("🪿 creating HONC app");

  const context = getContext();

  const prompts = [
    promptDescription,
    promptPath,
    promptTemplate,
    promptDatabase,
    promptDependencies,
    promptGit,
  ];

  for (const prompt of prompts) {
    const result = await prompt(context);
    if (isCancel(result)) {
      handleCancel();
    }

    if (result instanceof Error) {
      handleError(result);
    }
  }

  const actions = [
    actionTemplate,
    actionDatabase,
    actionDependencies,
    actionGit,
  ];

  for (const action of actions) {
    const result = await action(context);

    if (isCancel(result)) {
      handleCancel();
    }

    if (result instanceof Error) {
      handleError(result);
    }
  }

  const dbPreamble = context.flags.includes("setup-neon")
    ? "You can now navigate to the project folder and run the following commands to generate, apply the migrations and seed the database:"
    : "Once you've set up the database and saved the connection string, you can generate the migrations, apply them, and seed the database using the following commands";

 
    const dbD1 = context.template === "sample-d1" ? `${context.packageManager} run dev` : "";
    outro(`🪿 HONC app created successfully in ${context.path}!

${dbPreamble}

cd ${context.path}
${context.packageManager} run db:generate
${context.packageManager} run db:migrate
${dbD1}
${context.packageManager} run db:seed
`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
});
