#!/usr/bin/env node --experimental-modules

import { execSync } from "node:child_process";
import fs from "node:fs";
import path, { dirname } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import toml from "toml";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const script = args[0];

// HACK - If no script is specified, migrate the db then start running studio
//        This is a quick way to get started!
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
const { initialized: IS_INITIALIZING_FPX, config: USER_V0_CONFIG } =
  readUserConfig();

const USER_VARS = {};

loadUserConfigIntoUserVars();

runWizard();

/**
 * Run the wizard to get the user's configuration for FPX
 * If there are valid values in .fpxconfig, we skip asking questions
 */
async function runWizard() {
  // This looks confusing but the basic pattern is:
  // - If we're initializing, ask the user where we should run.
  //   The default (fallback) value is dynamic depending on env.
  // - If we're not initializing, try to skip the question based on local config, fall back to asking them.
  //
  const hasConfiguredFpxPort = getFallbackFpxPort() !== null;
  const fpxPortFallback = getFallbackFpxPort() || 8788;
  const fpxPortQuestion = "Which port should fpx studio run on? ";
  let FPX_PORT;
  if (IS_INITIALIZING_FPX) {
    FPX_PORT = await askUser(fpxPortQuestion, fpxPortFallback);
  } else if (hasConfiguredFpxPort) {
    FPX_PORT = fpxPortFallback;
  } else {
    FPX_PORT = await askUser(fpxPortQuestion, fpxPortFallback);
  }

  const FPX_SERVICE_TARGET = IS_INITIALIZING_FPX
    ? await askUser(
        "Which port is your service running on?",
        getFallbackServiceTarget() || 8787,
      )
    : getFallbackServiceTarget() ||
      (await askUser("Which port is your service running on?", 8787));

  const shouldAddToGitIgnoreAnswer = shouldAskToAddGitIgnore()
    ? await askUser("Add fpx.db to .gitignore?", "y")
    : "n";

  const shouldGitIgnore = cliAnswerToBool(shouldAddToGitIgnoreAnswer);

  if (!USER_VARS.FPX_PORT) {
    USER_VARS.FPX_PORT = FPX_PORT;
  }
  if (!USER_VARS.FPX_SERVICE_TARGET) {
    USER_VARS.FPX_SERVICE_TARGET = FPX_SERVICE_TARGET;
  }

  const SERVICE_NAME = getFallbackServiceName();
  if (!USER_VARS.FPX_SERVICE_NAME && SERVICE_NAME) {
    USER_VARS.FPX_SERVICE_NAME = SERVICE_NAME;
  }

  saveUserConfig(USER_VARS);

  if (shouldGitIgnore) {
    addGitIgnore();
  }

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

  execSync(command, {
    stdio: "inherit",
    env: { ...USER_VARS, ...process.env },
  });
}

/**
 * Looks for the project root by looking for a `package.json` file
 */
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
  } catch (_error) {
    // Silent error because we fallback to other values
    return null;
  }
}

/**
 * Reads the user's configuration from the `.fpxconfig` directory
 *
 * Returns an object with the following properties:
 * - initialized: boolean - whether the config file was just initialized
 * - config: object - the configuration object
 */
function readUserConfig() {
  let initialized = false;
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  const configPath = path.join(configDir, CONFIG_FILE_NAME);
  if (!fs.existsSync(configDir)) {
    initialized = true;
    fs.mkdirSync(configDir);
  }
  if (!fs.existsSync(configPath)) {
    initialized = true;
    fs.writeFileSync(configPath, JSON.stringify({}));
  }

  let config = safeParseJSONFile(configPath);
  if (!config) {
    initialized = true;
    config = {};
  }

  return {
    initialized,
    config,
  };
}

/**
 * Load the user's configuration into the USER_VARS object
 *
 * Hacky way to have some control over the configuration and env vars
 * that we ultimately inject when we run the api.
 */
function loadUserConfigIntoUserVars() {
  if (USER_V0_CONFIG?.FPX_PORT) {
    USER_VARS.FPX_PORT = USER_V0_CONFIG.FPX_PORT;
  }
  if (USER_V0_CONFIG?.FPX_SERVICE_TARGET) {
    USER_VARS.FPX_SERVICE_TARGET = USER_V0_CONFIG.FPX_SERVICE_TARGET;
  }
  if (USER_V0_CONFIG?.FPX_SERVICE_NAME) {
    USER_VARS.FPX_SERVICE_NAME = USER_V0_CONFIG.FPX_SERVICE_NAME;
  }
}

/**
 * Saves the user's configuration to the `.fpxconfig` directory
 */
function saveUserConfig(config) {
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  const configPath = path.join(configDir, CONFIG_FILE_NAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get the fallback port for FPX to run on
 *
 * This is either from the environment or the user's config
 */
function getFallbackFpxPort() {
  return process.env.FPX_PORT || USER_VARS.FPX_PORT || null;
}

/**
 * Get the fallback service name for FPX
 *
 * This is either from the environment, the user's config, or the package.json file
 */
function getFallbackServiceName() {
  return (
    process.env.FPX_SERVICE_NAME ||
    USER_VARS.FPX_SERVICE_NAME ||
    PACKAGE_JSON?.name ||
    null
  );
}

/**
 * Get the fallback service target for FPX
 *
 * This is either from the environment, the user's config, or the wrangler.toml file
 */
function getFallbackServiceTarget() {
  return (
    process.env.FPX_SERVICE_TARGET ||
    USER_VARS.FPX_SERVICE_TARGET ||
    PROJECT_PORT ||
    null
  );
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
 * Should we ask the user to add fpx.db to .gitignore?
 *
 * This is only true if we're initializing FPX and we're in a git repository
 */
function shouldAskToAddGitIgnore() {
  return IS_INITIALIZING_FPX && !!REPOSITORY_ROOT_DIR;
}

/**
 * Function that adds `fpx.db` to `.gitignore`
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

  const gitignoreEntry = "# fpx local database\nfpx.db\n";

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    if (!gitignoreContent.includes("fpx.db")) {
      fs.appendFileSync(gitignorePath, gitignoreEntry);
      console.debug(".gitignore updated with fpx.db entry.");
    }
  }
}

/**
 * Find the path to the .gitignore file
 *
 * This is either in the current directory or in the parent directories
 */
function findGitIgnore() {
  const gitIgnorePath = findInParentDirs(".gitignore");
  return gitIgnorePath || path.join(process.cwd(), ".gitignore");
}

// === UTILS === //

/**
 * Find the path to a file, recurisvely searching the parent directories
 */
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
    } catch (_error) {
      // Silent error because we fallback to other values
      return null;
    }
  }
  return null;
}

/**
 * Convert a user provided yes/no CLI answer to a boolean
 *
 * This is used to convert the answer to a boolean, with a fallback value
 */
function cliAnswerToBool(answer, fallback = false) {
  if (typeof answer !== "string") {
    return null;
  }
  return answer.toLowerCase().trim().startsWith("y") ? true : !!fallback;
}
