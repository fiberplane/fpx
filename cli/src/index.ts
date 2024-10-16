#!/usr/bin/env node
import { promptPath } from "@/actions/path";
import { actionTemplate, promptTemplate } from "@/actions/template";
import { intro, isCancel, outro } from "@clack/prompts";
import pico from "picocolors";
import { actionDatabase, promptDatabase } from "./actions/database";
import { actionDependencies, promptDependencies } from "./actions/dependencies";
import { promptDescription } from "./actions/description";
import { actionGit, promptGit } from "./actions/git";
import {
  actionSuperchargerFinish,
  actionSuperchargerStart,
} from "./actions/supercharger";
import { HONC_TITLE } from "./const";
import { getContext } from "./context";
import { isError } from "./types";
import { handleCancel, handleError } from "./utils";

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
    actionSuperchargerStart,
    actionDatabase,
    actionDependencies,
    actionGit,
    actionSuperchargerFinish,
  ];

  for (const action of actions) {
    const result = await action(context);

    if (isCancel(result)) {
      handleCancel();
    }

    if (isError(result)) {
      handleError(result);
    }
  }

  const dbPreamble = context.flags.includes("setup-neon")
    ? "You can now navigate to the project folder and run the following commands to generate, apply the migrations and seed the database:"
    : "Once you've set up the database and saved the connection string, you can generate the migrations, apply them, and seed the database using the following commands";

  // const dbD1 =
  //   context.template === "sample-d1" ? `${context.packageManager} run dev` : "";
  outro(`🪿 HONC app created successfully in ${context.path}!

${dbPreamble}

cd ${context.path}
${context.packageManager} run db:setup
${context.packageManager} run fiberplane
`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
});
