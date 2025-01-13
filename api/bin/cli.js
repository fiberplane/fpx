#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";

import logger from "./logger.js";
import {
  askUser,
  cliAnswerToBool,
  findInParentDirs,
  isPortTaken,
  safeParseJSONFile,
  safeParseTomlFile,
  selectClosestPath,
  updateWranglerCompatibilityFlags,
} from "./utils.js";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
// Handle empty string script (I don't think this happens in practice but let's be defensive)
const script = (args[0] ?? "").trim();

// HACK - If no script is specified, migrate the db then start running studio
//        This is a quick way to get started!
const scriptsToRun = !script ? ["migrate", "studio"] : [script];

const validScripts = {
  create: "npm create honc-app@latest -- --hatch",
  migrate: "dist/migrate.js",
  studio: "dist/src/index.node.js",
};

// Where we keep config files
const CONFIG_DIR_NAME = ".fpxconfig";
const CONFIG_FILE_NAME = "fpx.v0.config.json";

// Paths to relevant project directories and files
const WRANGLER_TOML_PATH = findInParentDirs("wrangler.toml");
const PACKAGE_JSON_PATH = findInParentDirs("package.json");
const PYPROJECT_TOML_PATH = findInParentDirs("pyproject.toml");
// NOTE - Deno projects might also not necessarily have a deno.json
const DENO_CONFIG_PATH = findInParentDirs(["deno.json", "deno.jsonc"]);
const PROJECT_ROOT_DIR = findProjectRoot() ?? process.cwd();

// Loading some possible configuration from the environment
const WRANGLER_TOML = safeParseTomlFile(WRANGLER_TOML_PATH);
const PACKAGE_JSON = safeParseJSONFile(PACKAGE_JSON_PATH);
const PROJECT_PORT = readWranglerPort();
const { initialized: IS_INITIALIZING_FPX, config: USER_V0_CONFIG } =
  readUserConfig();

const USER_VARS = {};

loadUserConfigIntoUserVars();

runWizard();

function createApp() {
  // HACK - Clear the user's config dir (since we might have a placeholder config after the last steps)
  //        so we start fresh when creating a new app
  clearUserConfigDir();
  runScript("create");
}

/**
 * Run the wizard to get the user's configuration for FPX
 * If there are valid values in .fpxconfig, we skip asking questions
 */
async function runWizard() {
  logger.debug("Running wizard");
  logger.debug("scriptsToRun", scriptsToRun);
  logger.debug("PROJECT_ROOT_DIR", PROJECT_ROOT_DIR);

  const isRunningCreate = scriptsToRun.includes("create");

  if (isRunningCreate) {
    createApp();
    return;
  }

  const MIGHT_BE_CREATING =
    IS_INITIALIZING_FPX && !WRANGLER_TOML && !PACKAGE_JSON;

  logger.debug("MIGHT_BE_CREATING", MIGHT_BE_CREATING);

  const question = chalk.green("🕵️ No project detected. Create a new app?");
  const isCreatingAnswer = MIGHT_BE_CREATING
    ? await askUser(question, "y")
    : "n";
  const shouldCreateApp = cliAnswerToBool(isCreatingAnswer);

  if (shouldCreateApp) {
    createApp();
    return;
  }

  if (IS_INITIALIZING_FPX) {
    logger.info(chalk.dim("\nInitializing FPX...\n"));
  } else {
    logger.info(chalk.dim(`\nLoading FPX config from ${CONFIG_DIR_NAME}...`));
  }

  const FPX_PORT = await getFpxPort();

  await updateEnvFileWithFpxEndpoint(FPX_PORT);

  await updateWranglerTomlWithNodejsCompatibility();

  const FPX_SERVICE_TARGET = await getServiceTarget();

  await pingTargetAndConfirm(FPX_SERVICE_TARGET);

  const FPX_DATABASE_URL = getFpxDatabaseUrl();

  // Refresh the config with any new values
  USER_VARS.FPX_PORT = FPX_PORT;
  USER_VARS.FPX_SERVICE_TARGET = FPX_SERVICE_TARGET;
  USER_VARS.FPX_DATABASE_URL = FPX_DATABASE_URL;

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
  // - If we're initializing use the fallback value, which is dynamic depending on env.
  // - If we're not initializing, try to determine based on the local config
  //  - If there was a preconfigured port, but it's taken, ask the user to choose a new port
  //
  const hasConfiguredFpxPort = getFallbackFpxPort() !== null;
  const fpxPortFallback = getFallbackFpxPort() || 8788;
  let FPX_PORT = fpxPortFallback;

  // If the user's selected port for running FPX is taken, try to find a new fallback
  // If the user specified a port to run on already, ask them to choose a new port
  while (await isPortTaken(FPX_PORT)) {
    const portAlreadyInUse = chalk.yellow(
      `Port ${FPX_PORT} is already in use.`,
    );
    logger.debug(`${portAlreadyInUse}, looking for another one...`);

    // Find a new fallback port
    let nextFallback = (Number.parseInt(FPX_PORT, 10) + 1).toString();

    // Make sure the fallback doesn't conflict with the service target
    const serviceTarget = getFallbackServiceTarget()?.toString();
    const hasConflict =
      nextFallback === serviceTarget ||
      serviceTarget?.endsWith(`:${nextFallback}`);
    if (hasConflict) {
      nextFallback = (Number.parseInt(nextFallback, 10) + 1).toString();
    }

    // HACK - If the nextFallback exceeds 65535, we're out of port range.
    //        So, we'll just default to 8787.
    if (hasConfiguredFpxPort || nextFallback > 65535) {
      FPX_PORT = await askUser(
        `  ⚠️ ${portAlreadyInUse}\n  Please choose a different port for FPX.`,
        nextFallback > 65535 ? "8787" : nextFallback,
      );
      if (nextFallback > 65535) {
        break;
      }
    } else {
      FPX_PORT = nextFallback;
    }
  }

  return FPX_PORT;
}

/**
 * Update the project's env file with the FPX_ENDPOINT variable,
 * if we can determine the env file to update.
 */
async function updateEnvFileWithFpxEndpoint(fpxPort) {
  const LOCALHOST_ENDPOINT = `http://localhost:${fpxPort}/v1/traces`;
  const DOCKER_ENDPOINT = `http://host.docker.internal:${fpxPort}/v1/traces`;
  const expectedFpxEndpoints = [LOCALHOST_ENDPOINT, DOCKER_ENDPOINT];

  if (shouldCreateDevVarsFile()) {
    touchDevVarsFile();
  }

  const envFilePath = findEnvVarFile();
  const envFileName = envFilePath && path.basename(envFilePath);
  const fpxEndpoint = envFilePath && getFpxEndpointFromEnvFile(envFilePath);
  const isDifferent = !expectedFpxEndpoints.includes(fpxEndpoint);

  // Ask the user if we should update the env file
  // - if an env file exists and the fpx endpoint is missing
  // - if an env file exists and the fpx endpoint is different
  const shouldAsk = envFilePath && (!fpxEndpoint || isDifferent);

  if (!shouldAsk) {
    return;
  }

  // NOTE - Default to adding a localhost endpoint instead of a docker one
  const envVarLine = `FPX_ENDPOINT=${LOCALHOST_ENDPOINT}`;
  const lede = !fpxEndpoint
    ? `  ⚠️ ${envFileName} needs to point to a local FPX Studio to work properly`
    : `  ⚠️ ${envFileName} points to a different FPX Studio endpoint`;
  const operation = !fpxEndpoint
    ? `  Add FPX Studio endpoint to ${envFileName}?`
    : `  Update FPX Studio endpoint in ${envFileName}?`;
  const question = [chalk.yellow(lede), operation].filter(Boolean).join("\n");
  const updateEnvVarAnswer = await askUser(question, "y");
  const shouldUpdateEnvVar = cliAnswerToBool(updateEnvVarAnswer);

  if (!shouldUpdateEnvVar) {
    return;
  }

  if (fpxEndpoint !== null) {
    logger.debug(
      `Replacing ${fpxEndpoint} with ${envVarLine} in ${envFilePath}`,
    );
    replaceEnvVarLine(envFilePath, envVarLine);
  } else {
    fs.appendFileSync(envFilePath, `\n${envVarLine}\n`);
  }
  logger.info(
    chalk.dim(`  ℹ️ Updated ${envFileName}. Remember to restart your api!`),
  );
}

/**
 * Get the service target for FPX (the service we should monitor)
 * This is necessary for auto detecting the routes of the app
 */
async function getServiceTarget() {
  const fpxTargetQuestion = "  Which port is your api running on?";
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
 * Checks if there is a service running on the target port
 * If not, asks the user to confirm whether to continue
 */
async function pingTargetAndConfirm(port) {
  const isServiceUp = await isPortTaken(port);
  if (!isServiceUp) {
    await askUser(
      `  ⚠️ Could not find your api on port ${port}. Remember to start it!\n  ${chalk.dim("(Press enter to continue.)")}`,
    );
  }
}

/**
 * Update the project's wrangler.toml with the nodejs_compat flag
 * The line should look like this:

    compatibility_flags = [ "nodejs_compat" ]

 * Skip if:
 * - The wrangler.toml file does not exist
 * - The compatibility_flags array already includes "nodejs_compat"
 */
async function updateWranglerTomlWithNodejsCompatibility() {
  logger.debug(
    "Checking wrangler.toml for nodejs compatibility flag",
    WRANGLER_TOML_PATH,
    WRANGLER_TOML,
  );

  const hasNodejsCompatFlag =
    WRANGLER_TOML?.compatibility_flags?.includes("nodejs_compat");

  if (!WRANGLER_TOML_PATH) {
    logger.debug("Wrangler.toml not found");
    return;
  }

  if (hasNodejsCompatFlag) {
    logger.debug(
      "Wrangler.toml already has nodejs compatibility flag",
      WRANGLER_TOML,
    );
    return;
  }

  const lede = "  ⚠️ wrangler.toml needs to specify the nodejs_compat flag";
  const operation = "  Add Nodejs compatibility flag to wrangler.toml?";
  const question = [chalk.yellow(lede), operation].filter(Boolean).join("\n");
  const updateWranglerTomlAnswer = await askUser(question, "y");
  const shouldUpdateWranglerToml = cliAnswerToBool(updateWranglerTomlAnswer);

  if (!shouldUpdateWranglerToml) {
    return;
  }

  logger.debug(
    `Replacing ${WRANGLER_TOML_PATH} with node.js compatibility flag`,
  );

  const nextToml = { ...WRANGLER_TOML };
  if (!nextToml.compatibility_flags) {
    nextToml.compatibility_flags = [];
  }
  nextToml.compatibility_flags.push("nodejs_compat");

  updateWranglerCompatibilityFlags(WRANGLER_TOML_PATH, nextToml);

  logger.info(
    chalk.dim(
      `  ℹ️ Updated ${WRANGLER_TOML_PATH} with nodejs compatibility flag`,
    ),
  );
}

/**
 * Run the specified script (assumed to be in ../scripts)
 */
function runScript(scriptName) {
  const scriptPath = validScripts[scriptName];
  if (!scriptPath) {
    logger.error(
      `Invalid script "${scriptName}". Valid scripts are: ${Object.keys(validScripts).join(", ")}`,
    );
    process.exit(1);
  }

  if (scriptName === "create") {
    execSync(scriptPath, {
      stdio: "inherit",
      env: { ...USER_VARS, ...process.env },
    });
    return;
  }

  if (scriptName === "studio") {
    logger.info(chalk.bold("\nTime   Level   Message"));
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
 * Looks for the project root by looking first for a `wrangler.toml` file, then a `package.json` file,
 * then a `deno.json` file or a `deno.jsonc` file.
 * Searches all parent directories up to the root of the filesystem
 */
function findProjectRoot() {
  // HACK - If the user has a rogue package.json way up the filesystem,
  //        we want to ignore it in favor of, e.g., a closer Wrangler.toml or Deno.json file
  const projectRoot = selectClosestPath([
    WRANGLER_TOML_PATH,
    PACKAGE_JSON_PATH,
    DENO_CONFIG_PATH,
    PYPROJECT_TOML_PATH,
  ]);
  if (!projectRoot) {
    logger.debug("No project root detected");
    return null;
  }
  logger.debug("Project root detected:", projectRoot);
  return path.dirname(projectRoot);
}

/**
 * Read the service port from wrangler.toml, if it exists
 */
function readWranglerPort() {
  return WRANGLER_TOML?.dev?.port || null;
}

/**
 * Check if the project has a wrangler.toml file in the current working directory
 */
function hasWranglerToml() {
  return WRANGLER_TOML_PATH !== null;
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
  const gitignorePath = path.join(configDir, ".gitignore");
  const gitignoreEntry =
    "\n# fpx local database\nfpx.db\n# fpx local env vars\nfpx.v0.config.json\n";

  // Create the .fpxconfig directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    initialized = true;
    fs.mkdirSync(configDir);
  }

  // Create the fpx configuration file if it doesn't exist
  if (!fs.existsSync(configPath)) {
    initialized = true;
    fs.writeFileSync(configPath, JSON.stringify({}));
  }

  // Create a .gitignore in the config dir
  // Add the fpx.db file to the .gitignore file if it doesn't exist
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, gitignoreEntry);
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  if (!gitignoreContent.includes("fpx.db")) {
    fs.appendFileSync(gitignorePath, gitignoreEntry);
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

function clearUserConfigDir() {
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  fs.rmSync(configDir, { recursive: true });
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
  if (USER_V0_CONFIG?.FPX_DATABASE_URL) {
    USER_VARS.FPX_DATABASE_URL = USER_V0_CONFIG.FPX_DATABASE_URL;
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
 * This is either from the environment, the user's config, the wrangler.toml file, or the package.json file
 */
function getFallbackServiceName() {
  return (
    process.env.FPX_SERVICE_NAME ||
    USER_VARS.FPX_SERVICE_NAME ||
    WRANGLER_TOML?.name ||
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
 * Find the environment variable file with the given precedence
 */
function findEnvVarFile() {
  const envFiles = [".dev.vars", ".env.local", ".env.dev", ".env"];
  // To support monorepos, first look in current working directory for one of the common env files
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  // Then, check the project root!
  for (const file of envFiles) {
    const filePath = path.join(PROJECT_ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Create an empty .dev.vars file in the project root or update its modification time if it exists
 */
function touchDevVarsFile() {
  const devVarsPath = path.join(PROJECT_ROOT_DIR, ".dev.vars");
  try {
    fs.closeSync(fs.openSync(devVarsPath, "a"));
    logger.info(chalk.dim("  ℹ️ Touched .dev.vars file"));
  } catch (error) {
    logger.debug(
      chalk.red(`  ❤️‍🩹 Failed to touch .dev.vars file: ${error.message}`),
    );
  }
}

/**
 * Check if we should create the .dev.vars file
 *
 * This is true if the user has a wrangler.toml file in the project root
 * and the .dev.vars file does not exist there
 */
function shouldCreateDevVarsFile() {
  if (!hasWranglerToml()) {
    return false;
  }
  const devVarsFilePath = path.join(PROJECT_ROOT_DIR, ".dev.vars");
  try {
    return !fs.existsSync(devVarsFilePath);
  } catch {
    return false;
  }
}

/**
 * Read the environment variable file and check for FPX_ENDPOINT
 */
function getFpxEndpointFromEnvFile(envFilePath) {
  try {
    const envContent = fs.readFileSync(envFilePath, "utf8");
    // NOTE - This regex uses multiline mode
    const match = envContent.match(/^FPX_ENDPOINT=(.*)$/m);
    return match ? match[1] : null;
  } catch (_error) {
    // Silent error because we do not want errors to stop the cli from running
    return null;
  }
}

/**
 * Replace the line in the env file with the new value
 */
function replaceEnvVarLine(envFilePath, envVarLine) {
  const envContent = fs.readFileSync(envFilePath, "utf8");
  // NOTE - This regex uses multiline mode
  const updatedContent = envContent.replace(/^FPX_ENDPOINT=.*$/m, envVarLine);
  fs.writeFileSync(envFilePath, updatedContent);
}

/**
 * Get the path to the FPX database
 *
 * This is in the `.fpxconfig` directory, which allows us to gitignore it more cleanly
 */
function getFpxDatabaseUrl() {
  const configDir = path.join(PROJECT_ROOT_DIR, CONFIG_DIR_NAME);
  const dbPath = path.join(configDir, "fpx.db");
  return `file:${dbPath}`;
}
