#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import toml from "toml";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const script = args[0];

// HACK - if no script is specified, migrate the db then start running studio
//        this is a quick way to get started!
const scriptsToRun = !script ? ["migrate", "studio"] : [script];

const validScripts = {
  migrate: "dist/migrate.js",
  studio: "dist/src/index.node.js",
};

// Where we keep config files
const CONFIG_DIR_NAME = ".fpxconfig";
const CONFIG_FILE_NAME = "fpx.v0.config.json";

// Paths to relevant project directories and files
const PROJECT_ROOT_DIR = findProjectRoot();
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT_DIR, "package.json");
const REPOSITORY_ROOT_DIR = findGitRoot();

// Loading some possible configuration from the environment
const PACKAGE_JSON = safeParseJSONFile(PACKAGE_JSON_PATH);
const PROJECT_PORT = readWranglerPort();
const USER_V0_CONFIG = readUserConfig();
const USER_VARS = {};

runWizard();

/**
 * Run the wizard to get the user's configuration for FPX
 * If there are valid values in .fpxconfig, we skip asking questions
 */
async function runWizard() {
  const FPX_PORT = getFallbackFpxPort() || await askUser("Which port should fpx studio run on?", 8788);
  const FPX_SERVICE_TARGET = getFallbackServiceTarget() || await askUser("Which port is your service running on?", 8787);

  if (!USER_V0_CONFIG.FPX_PORT) {
    USER_V0_CONFIG.FPX_PORT = FPX_PORT;
  }
  if (!USER_V0_CONFIG.FPX_SERVICE_TARGET) {
    USER_V0_CONFIG.FPX_SERVICE_TARGET = FPX_SERVICE_TARGET;
  }

  const SERVICE_NAME = getFallbackServiceName();
  if (!USER_V0_CONFIG.FPX_SERVICE_NAME && SERVICE_NAME) {
    USER_V0_CONFIG.FPX_SERVICE_NAME = SERVICE_NAME;
  }

  saveUserConfig(USER_V0_CONFIG);

  addGitIgnore();

  scriptsToRun.forEach(runScript);
}

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

  execSync(command, { stdio: "inherit", env: { ...USER_VARS, ...process.env } });
}

function findProjectRoot() {
  const projectRoot = findInParentDirs("package.json");
  if (!projectRoot) {
    return null;
  }
  return path.dirname(projectRoot);
}

/**
 * Find the root of the git repository, if we're in one
 */
function findGitRoot() {
  const gitRoot = findInParentDirs(".git");
  return gitRoot ? path.dirname(gitRoot) : null;
}

/**
 * Read the service port from wrangler.toml, if it exists
 */
function readWranglerPort() {
  try {
    const wranglerPath = path.join(process.cwd(), "wrangler.toml");
    if (fs.existsSync(wranglerPath)) {
      const wranglerContent = fs.readFileSync(wranglerPath, "utf8");
      const wranglerConfig = toml.parse(wranglerContent);
      return wranglerConfig?.port || null;
    }
  } catch (error) {
    return null;
  }
}

function readUserConfig() {
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  const configPath = path.join(configDir, CONFIG_FILE_NAME);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}));
  }
  return safeParseJSONFile(configPath) || {};
}

function saveUserConfig(config) {
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  const configPath = path.join(configDir, CONFIG_FILE_NAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getFallbackFpxPort() {
  return process.env.FPX_PORT || USER_VARS.FPX_PORT || null;
}

function getFallbackServiceName() {
  return process.env.FPX_SERVICE_NAME || USER_VARS.FPX_SERVICE_NAME || PACKAGE_JSON?.name || null;
}

function getFallbackServiceTarget() {
  return process.env.FPX_SERVICE_TARGET || USER_VARS.FPX_SERVICE_TARGET || PROJECT_PORT || null;
}

/**
 * Quick helper for asking the user for input, with a default value
 */
async function askUser(question, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (default: ${defaultValue}): `, (answer) => {
      rl.close();
      resolve(answer?.trim() || defaultValue);
    });
  });
}

/**
 * Function that adds `mizu.dev` to `.gitignore`
 *
 * As of writing, only works when `.gitignore` is in the directory in which
 * this executable is run.
 */
function addGitIgnore() {
  const gitignorePath = findGitIgnore();

  if (!REPOSITORY_ROOT_DIR) {
    return;
  }

  if (!gitignorePath) {
    return;
  }

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, "");
  }

  const gitignoreEntry = "# fpx local database\nmizu.db\n";

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    if (!gitignoreContent.includes("mizu.db")) {
      fs.appendFileSync(gitignorePath, gitignoreEntry);
      console.debug(".gitignore updated with mizu.db entry.");
    }
  }
}

function findGitIgnore() {
  const gitIgnorePath = findInParentDirs(".gitignore");
  return gitIgnorePath || path.join(process.cwd(), ".gitignore");
}

// === UTILS === //
function findInParentDirs(fileName) {
  let currentDir = process.cwd();
  const visitedDirs = new Set();
  while (currentDir !== path.parse(currentDir).root) {
    if (visitedDirs.has(currentDir)) {
      break;
    }
    visitedDirs.add(currentDir);
    const filePath = path.join(currentDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

function safeParseJSONFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  return null;
}