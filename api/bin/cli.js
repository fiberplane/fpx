#!/usr/bin/env node

import { execSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const script = args[0];

// HACK - if no script is specified, migrate then open studio
const scripts = !script ? ["migrate", "studio"] : [script];

const validScripts = {
  migrate: "dist/migrate.js",
  studio: "dist/src/index.node.js",
};

scripts.forEach(runScript);

function runScript(scriptName) {
  const scriptPath = validScripts[scriptName];
  if (!scriptPath) {
    console.error(
      `Invalid script "${scriptName}". Valid scripts are: ${Object.keys(validScripts).join(", ")}`,
    );
    process.exit(1);
  }

  // Get the root directory of this script's project
  const scriptDir = path.resolve(__dirname, "../");

  // Construct the command to run the appropriate script in the `dist` folder
  const command = `node ${path.join(scriptDir, scriptPath)}`;

  execSync(command, { stdio: "inherit" });
}

