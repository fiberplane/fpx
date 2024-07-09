#!/usr/bin/env node --experimental-modules

import { execSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
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
  if (IS_INITIALIZING_FPX) {
    console.log("Initializing FPX...");
  }

  const FPX_PORT = await getFpxPort();

  await updateEnvFileWithFpxEndpoint(FPX_PORT);

  const FPX_SERVICE_TARGET = await getServiceTarget();

  await maybeUpdateGitIgnore();

  // Refresh the config with any new values
  USER_VARS.FPX_PORT = FPX_PORT;
  USER_VARS.FPX_SERVICE_TARGET = FPX_SERVICE_TARGET;

  const SERVICE_NAME = getFallbackServiceName();
  if (!USER_VARS.FPX_SERVICE_NAME && SERVICE_NAME) {
    USER_VARS.FPX_SERVICE_NAME = SERVICE_NAME;
  }

  // Save the user's configuration to the .fpxconfig directory
  saveUserConfig(USER_VARS);

  scriptsToRun.forEach(runScript);
}

/**
 * Get the port for FPX Studio to run on
 */
async function getFpxPort() {
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

  // If the user's selected port for running FPX is taken, try to find a new fallback and then ask again
  while (await isPortTaken(FPX_PORT)) {
    let nextFallback = (Number.parseInt(FPX_PORT, 10) + 1).toString();
    // Make sure the fallback doesn't conflict with the service target
    if (nextFallback === getFallbackServiceTarget()?.toString()) {
      nextFallback = (Number.parseInt(nextFallback, 10) + 1).toString();
    }
    FPX_PORT = await askUser(
      `Port ${FPX_PORT} is already in use. Please choose a different port for FPX.`,
      nextFallback,
    );
  }

  return FPX_PORT;
}

/**
 * Update the project's env file with the FPX_ENDPOINT variable,
 * if we can determine the env file to update.
 */
async function updateEnvFileWithFpxEndpoint(fpxPort) {
  const expectedFpxEndpoint = `http://localhost:${fpxPort}/v0/logs`;

  const envFilePath = findEnvVarFile();
  const envFileName = envFilePath && path.basename(envFilePath);
  const fpxEndpoint = envFilePath && getFpxEndpointFromEnvFile(envFilePath);
  const isDifferent = fpxEndpoint !== expectedFpxEndpoint;

  const shouldAsk = envFilePath && !fpxEndpoint && isDifferent;

  if (shouldAsk) {
    const question = `May we update your ${envFileName} file with FPX_ENDPOINT=${expectedFpxEndpoint}`;
    const updateEnvVarAnswer = await askUser(question, "y");
    const shouldUpdateEnvVar = cliAnswerToBool(updateEnvVarAnswer);
    if (shouldUpdateEnvVar) {
      fs.appendFileSync(
        envFilePath,
        `\nFPX_ENDPOINT=http://localhost:${fpxPort}/v0/logs\n`,
      );
      console.log(`Updated ${envFileName}.`);
    }
  }
}

/**
 * Get the service target for FPX (the service we should monitor)
 * This is necessary for auto detecting the routes of the app
 */
async function getServiceTarget() {
  const fpxTargetQuestion = "Which port is your service running on?";
  const fpxTargetFallback = getFallbackServiceTarget() || 8787;
  const hasConfiguredTarget = getFallbackServiceTarget() !== null;

  // This looks confusing but the basic pattern is:
  // - If we're initializing, ask the user where we should run.
  //   The default (fallback) value is dynamic depending on env.
  // - If we're not initializing, try to skip the question based on local config, fall back to asking them.
  //
  let FPX_SERVICE_TARGET;
  if (IS_INITIALIZING_FPX) {
    FPX_SERVICE_TARGET = await askUser(fpxTargetQuestion, fpxTargetFallback);
  } else if (hasConfiguredTarget) {
    FPX_SERVICE_TARGET = getFallbackServiceTarget();
  } else {
    FPX_SERVICE_TARGET = await askUser(fpxTargetQuestion, fpxTargetFallback);
  }

  return FPX_SERVICE_TARGET;
}

/**
 * Update the project's .gitignore file with the FPX database,
 * if we determine we're in a git repo, and the user gives permission.
 */
async function maybeUpdateGitIgnore() {
  const shouldAddToGitIgnoreAnswer = shouldAskToAddGitIgnore()
    ? await askUser(
        "May we add our local database, fpx.db, to your .gitignore?",
        "y",
      )
    : "n";

  const shouldGitIgnore = cliAnswerToBool(shouldAddToGitIgnoreAnswer);

  if (shouldGitIgnore) {
    addGitIgnore();
  }
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
      return wranglerConfig?.dev?.port || null;
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

  const gitignoreEntry = "\n# fpx local database\nfpx.db\n";

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

/**
 * Find the environment variable file with the given precedence
 */
function findEnvVarFile() {
  const envFiles = [".dev.vars", ".env.local", ".env.dev", ".env"];
  for (const file of envFiles) {
    const filePath = path.join(PROJECT_ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Read the environment variable file and check for FPX_ENDPOINT
 */
function getFpxEndpointFromEnvFile(envFilePath) {
  try {
    const envContent = fs.readFileSync(envFilePath, "utf8");
    const match = envContent.match(/^FPX_ENDPOINT=(.*)$/m);
    return match ? match[1] : null;
  } catch (_error) {
    // Silent error because we do not want errors to stop the cli from running
    return null;
  }
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

/**
 * Check if a port is taken
 *
 * This is a hacky way to check if a port is taken, because the `net` module
 * doesn't have a built-in way to do this.
 *
 * We check on both IPv4 and IPv6, and bind to 0.0.0.0 and ::, since only looking at localhost didn't actually work for me!
 *
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - Resolves to true if the port is taken, false otherwise
 */
async function isPortTaken(port) {
  return new Promise((resolve, reject) => {
    let successCount = 0;

    const testIPv4 = net
      .createServer()
      .once("error", (err) => {
        if (err.code !== "EADDRINUSE") return reject(err);
        resolve(true);
      })
      .once("listening", () => {
        testIPv4
          .once("close", () => {
            successCount++;
            if (successCount === 2) resolve(false);
          })
          .close();
      })
      .listen(port, "0.0.0.0");

    const testIPv6 = net
      .createServer()
      .once("error", (err) => {
        if (err.code !== "EADDRINUSE") return reject(err);
        resolve(true);
      })
      .once("listening", () => {
        testIPv6
          .once("close", () => {
            successCount++;
            if (successCount === 2) resolve(false);
          })
          .close();
      })
      .listen(port, "::");
  });
}
