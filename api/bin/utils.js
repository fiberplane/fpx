import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
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
      rl.close();
      resolve(answer?.trim() || defaultValue);
    });
  });
}

/**
 * Find the path to a file, recurisvely searching the parent directories
 */
export function findInParentDirs(fileName) {
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
 * We check on both IPv4 and IPv6, and look on:
 * - `127.0.0.1` and `::1`, the loopback interfaces
 * - also on `0.0.0.0` and `::`, since only looking at localhost didn't detect FPX studio!
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
  const isTakenOnAnyInterface = await isPortTakenOnHosts(
    port,
    "0.0.0.0",
    "::",
  ).catch(handlePortSearchError);
  const isTakenOnLoopbackInterface = await isPortTakenOnHosts(
    port,
    "127.0.0.1",
    "::1",
  ).catch(handlePortSearchError);
  return isTakenOnAnyInterface || isTakenOnLoopbackInterface;
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
  logger.debug(`Checking if port ${port} is taken...`);
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
      .listen(port, ipv4Host);

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
      .listen(port, ipv6Host);
  });
}
