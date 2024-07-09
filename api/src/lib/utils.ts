import fs from "node:fs";

/**
 * Hacky helper in case you want to try parsing a message as json, but want to fall back to its og value
 */
export function tryParseJsonObjectMessage(str: unknown) {
  if (typeof str !== "string") {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

/**
 * Quick and dirty uuid utility
 */
export function generateUUID() {
  const timeStamp = new Date().getTime().toString(36);
  const randomPart = () => Math.random().toString(36).substring(2, 15);
  return `${timeStamp}-${randomPart()}-${randomPart()}`;
}

export function errorToJson(error: Error) {
  return {
    name: error.name, // Includes the name of the error, e.g., 'TypeError'
    message: error.message, // The message string of the error
    stack: error.stack ?? "", // Stack trace of where the error occurred (useful for debugging)
    // Optionally add more properties here if needed
  };
}

export function getIgnoredPaths() {

const defaultIgnoredPaths = [
  ".git", 
  "node_modules",
  "dist", 
  ".fpx", 
  ".swc", 
  ".wrangler"
];

  const paths = fs.readdirSync("./", { withFileTypes: true });
  const gitignoreFiles = paths.filter((path) => path.name === ".gitignore");

  const gitignoredPaths = gitignoreFiles.map((gitignoreFile) => {
    const content = fs.readFileSync(gitignoreFile.name, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .filter((line) => !line.startsWith("#"))
  });


  return defaultIgnoredPaths.concat(...gitignoredPaths);
}
