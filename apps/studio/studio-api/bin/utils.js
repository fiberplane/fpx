import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import toml from "@iarna/toml";
import chalk from "chalk";

import logger from "./logger.js";

/**
 * Quick helper for asking the user for input, with a default value
 */
export async function askUser(prompt, defaultValue) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const dimmedDefaultValue = chalk.dim(`(default: ${defaultValue})`);
    const question = defaultValue ? `${prompt} ${dimmedDefaultValue} ` : prompt;
    rl.question(question, (answer) => {
      // If we don't have a default value, move the cursor up one line to remove the question
      // This assumes that a lack of a default value implies we are telling the user something, instead of asking them for input
      if (!defaultValue) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
      }
      rl.close();
      resolve(answer?.trim() || defaultValue);
    });
  });
}

/**
 * Find the closest matching full path to a file or list of files, searching parent directories
 *
 * @param {string | string[]} fileNames - A single filename, or a list of file names to search for
 * @returns {string|null} - The closest file path, or null if none found
 */
export function findInParentDirs(fileNames) {
  const results = Array.isArray(fileNames)
    ? fileNames.map(findSingleFileInParentDirs)
    : [findSingleFileInParentDirs(fileNames)];

  // Filter out null results
  /** @type {string[]} */
  const paths = [];
  for (const result of results) {
    if (result) {
      paths.push(result);
    }
  }

  if (paths.length === 0) {
    return null;
  }

  paths.sort((a, b) => {
    const aDepth = a.split(path.sep).length;
    const bDepth = b.split(path.sep).length;
    return aDepth - bDepth;
  });

  return paths[0];
}

/**
 * Select the closest path from a list of paths
 * @NOTE - Assumes that all paths are either in current directory or in parent directory!!!
 *
 * @param {Array<string|null>} filePaths - The list of file paths to search for
 * @returns {string|null} - The closest file path, or null if none found
 */
export function selectClosestPath(filePaths) {
  const paths = filePaths.filter(Boolean);

  if (paths.length === 0) {
    return null;
  }

  paths.sort((a, b) => {
    const aDepth = a.split(path.sep).length;
    const bDepth = b.split(path.sep).length;
    return bDepth - aDepth;
  });

  return paths[0];
}

/**
 * Find the path to a file, recurisvely searching the parent directories
 *
 * @param {string} fileName - The name of the file to search for
 * @returns {string|null} - The full path to the file, or null if not found
 */
function findSingleFileInParentDirs(fileName) {
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

export function safeParseJSONFile(filePath) {
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
 * Safely parse a TOML file.
 * @param {string} filePath - The path to the TOML file.
 * @returns {object|null} - The parsed TOML object, or null if parsing fails.
 */
export function safeParseTomlFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return toml.parse(fileContent);
    }
  } catch (error) {
    logger.debug(`Failed to parse TOML file at ${filePath}:`, error);
  }
  return null;
}

/**
 * Save a TOML file to disk
 */
export function saveTomlFile(filePath, tomlData) {
  const fileContent = toml.stringify(tomlData);
  fs.writeFileSync(filePath, fileContent);
}

/**
 * Update a wrangler.toml file with a new compatibility flag
 *
 * Uses the following logic:
 *
 * - If the compatibility_flags line doesn't exist, but the compatibility_date line does, insert the compatibility_flags line after the compatibility_date line
 * - If the compatibility_flags line exists, replace the existing compatibility_flags line with the new one
 * - If neither of the above conditions are met, then we'll have to toml stringify the js object we got from parsing their wrangler file
 *   and unfortuantely this wll erase all the user's comments :/
 */
export function updateWranglerCompatibilityFlags(filePath, nextToml) {
  // Get stringified version of current toml file
  const stringifiedPrevToml = safeReadFile(filePath);
  const prevTomlLines = stringifiedPrevToml.split("\n");

  // Get the stringified version of the new toml file
  let stringifiedNewToml = toml.stringify(nextToml);

  // Get the new compatibility_flags line from thew new file
  const newCompatibilityFlagsLine = stringifiedNewToml
    .split("\n")
    .find((line) => line.startsWith("compatibility_flags"));

  // Look for the old compatibility_date line in the current file
  const prevTomlCompatDateIndex = prevTomlLines.findIndex((line) =>
    line.startsWith("compatibility_date"),
  );

  // Look for the old compatibility_flags line in the current file
  const prevTomlCompatFlagsIndex = prevTomlLines.findIndex((line) =>
    line.startsWith("compatibility_flags"),
  );

  // Check if we should replace the existing compatibility_flags line
  const shouldReplaceExistingCompatLine = prevTomlCompatFlagsIndex !== -1;

  // Check if we should insert the new compatibility_flags line after the compatibility_date line
  const shouldInsertAfterCompatibilityDate =
    !shouldReplaceExistingCompatLine && prevTomlCompatDateIndex !== -1;

  // Try to add after the compatibility_date line
  if (shouldInsertAfterCompatibilityDate) {
    logger.debug(
      "We are going try hackily inserting the compatibility_flags line after the compatibility_date line",
    );
    stringifiedNewToml = [
      ...prevTomlLines.slice(0, prevTomlCompatDateIndex + 1),
      newCompatibilityFlagsLine,
      ...prevTomlLines.slice(prevTomlCompatDateIndex + 1),
    ].join("\n");
    fs.writeFileSync(filePath, stringifiedNewToml);
    return;
  }

  if (shouldReplaceExistingCompatLine) {
    // Try to replace the existing compatibility_flags line
    logger.debug(
      "We are going try to replace the existing compatibility_flags line",
    );
    stringifiedNewToml = [
      ...prevTomlLines.slice(0, prevTomlCompatFlagsIndex),
      newCompatibilityFlagsLine,
      ...prevTomlLines.slice(prevTomlCompatFlagsIndex + 1),
    ].join("\n");
    fs.writeFileSync(filePath, stringifiedNewToml);
    return;
  }

  // If we can't do any of the above, we'll have to toml stringify and clobber the user's comments :/
  logger.debug(
    "We are going to have to toml stringify and clobber the user's comments :(",
  );
  saveTomlFile(filePath, nextToml);
}

/**
 * Convert a user provided yes/no CLI answer to a boolean
 *
 * This is used to convert the answer to a boolean, with a fallback value
 */
export function cliAnswerToBool(answer, fallback = false) {
  if (typeof answer !== "string") {
    return null;
  }
  return answer.toLowerCase().trim().startsWith("y") ? true : !!fallback;
}

/**
 * Check if a port is taken on the local machine's network interfaces
 *
 * This is a hacky way to check if a port is taken, because the `net` module
 * doesn't have a built-in way to do this.
 *
 * We check on both IPv4 and IPv6, assuming the end user's OS uses a dual stack.
 * We might be able to remove the IPv6 checks...
 *
 * On macOS we look on:
 * - `127.0.0.1` and `::1`, the loopback interfaces
 * - also on `0.0.0.0` and `::`, since only looking at localhost didn't detect FPX studio!
 *
 * On Linux, we should only check on the loopback interfaces. `0.0.0.0` is interpreted differently.
 *
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - Resolves to true if the port is taken, false otherwise
 */
export async function isPortTaken(port) {
  const handlePortSearchError = (err) => {
    logger.debug(
      `Error checking if port ${port} is taken: ${err}. Defaulting to false`,
    );
    return false;
  };

  const isTakenOnLoopbackInterface = await isPortTakenOnHosts(
    port,
    "127.0.0.1",
    "::1",
  ).catch(handlePortSearchError);

  // HACK - Checking `0.0.0.0` on Ubuntu is a trap!
  // TODO - Also test on Windows whether we should skip 0.0.0.0. (To be safe for now, only run this check on macOS.)
  if (isMacOS()) {
    const isTakenOnAnyInterface = await isPortTakenOnHosts(
      port,
      "0.0.0.0",
      "::",
    ).catch(handlePortSearchError);
    return isTakenOnAnyInterface || isTakenOnLoopbackInterface;
  }

  return isTakenOnLoopbackInterface;
}

/**
 * Check if a port is taken on a specific host
 *
 * @param {number} port - The port to check
 * @param {string} ipv4Host - The IPv4 host to check
 * @param {string} ipv6Host - The IPv6 host to check
 * @returns {Promise<boolean>} - Resolves to true if the port is taken on either host, false otherwise
 */
async function isPortTakenOnHosts(port, ipv4Host, ipv6Host) {
  return new Promise((resolve, reject) => {
    let successCount = 0;

    isPortTakenOnHost(port, ipv4Host)
      .then((isTaken) => {
        if (isTaken) {
          logger.debug(`Port ${port} is taken on ${ipv4Host}`);
          resolve(true);
        } else {
          successCount++;
          if (successCount === 2) {
            resolve(false);
          }
        }
      })
      .catch(reject);

    isPortTakenOnHost(port, ipv6Host)
      .then((isTaken) => {
        if (isTaken) {
          resolve(true);
        } else {
          successCount++;
          if (successCount === 2) {
            resolve(false);
          }
        }
      })
      .catch(reject);
  });
}

/**
 * Check if a port is taken on a specific host
 *
 * @param {number} port - The port to check
 * @param {string} host - The host to check
 * @returns {Promise<boolean>} - Resolves to true if the port is taken on either host, false otherwise
 */
async function isPortTakenOnHost(port, host) {
  logger.debug(`Checking if port ${port} is taken on ${host}...`);
  return new Promise((resolve, reject) => {
    const test = net
      .createServer()
      .once("error", (err) => {
        if (err.code !== "EADDRINUSE") {
          logger.debug(`Error binding to ${port} on ${host}:`, err);
          return reject(err);
        }
        resolve(true);
      })
      .once("listening", () => {
        test
          .once("close", () => {
            resolve(false);
          })
          .close();
      })
      .listen(port, host);
  });
}

/**
 * Check if the current operating system is macOS
 *
 * @returns {boolean} - Returns true if the current OS is macOS, false otherwise
 */
export function isMacOS() {
  return process.platform === "darwin";
}

/**
 * Safely read a file from disk
 *
 * @param {string} filePath - The path to the file to read
 * @returns {string|null} - The contents of the file, or null if the file does not exist
 */
export function safeReadFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return fileContent.toString();
  }
  return null;
}
