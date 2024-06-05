#!/usr/bin/env node

const { execSync } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const script = args[0];

const validScripts = {
  migrate: "dist/migrate.js",
  studio: "dist/src/index.node.js",
};

if (!validScripts[script]) {
  console.error(
    `Invalid script "${script}". Valid scripts are: ${Object.keys(validScripts).join(", ")}`,
  );
  process.exit(1);
}

// Get the root directory of this script's project
const scriptDir = path.resolve(__dirname, "../");

// Construct the command to run the appropriate script in the `dist` folder
const command = `node ${path.join(scriptDir, validScripts[script])}`;

execSync(command, { stdio: "inherit" });
