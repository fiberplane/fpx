#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const script = args[0];

// HACK - if no script is specified, migrate then start running studio
//        this is a quick way to get started!
const scriptsToRun = !script ? ["migrate", "studio"] : [script];

const validScripts = {
  migrate: "dist/migrate.js",
  studio: "dist/src/index.node.js",
};

addGitIgnore();

scriptsToRun.forEach(runScript);

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

/**
 * Function that adds `mizu.dev` to `.gitignore`
 *
 * As of writing, only works when `.gitignore` is in the directory in which
 * this executable is run.
 */
function addGitIgnore() {
  // IMPROVE - Search for nearest git repository and add to that instead
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  const gitignoreEntry = "# mizu local database\nmizu.db\n";

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    // IMPROVE - Split by line and look for a line that starts with mizu.db, follow by a space or nothing
    if (!gitignoreContent.includes("mizu.db")) {
      fs.appendFileSync(gitignorePath, gitignoreEntry);
      console.debug(".gitignore updated with mizu.db entry.");
    }
  } else {
    // fs.writeFileSync(gitignorePath, gitignoreEntry);
    // console.log(".gitignore created and mizu.db entry added.");
  }
}
