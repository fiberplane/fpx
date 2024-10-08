import * as fs from "node:fs";
import * as path from "node:path";
import logger from "../../../logger.js";
import { findSourceFunctions } from "../../find-source-function/index.js";

/**
 * Retrieves the source function text from the compiled JavaScript directory.
 *
 * On even a medium sized codebase, these lookups can take 600ms
 *
 * @param {string} projectPath - The path to the project directory.
 * @param {string} functionString - The text of the function to retrieve.
 * @returns {Promise<string | null>} The source function text if found, otherwise null.
 */
export async function getSourceFunctionText(
  projectPath: string,
  functionString: string,
): Promise<{ text: string | null; sourceFile: string | null } | null> {
  const compiledJavascriptPath = findWranglerCompiledJavascriptDir(projectPath);
  if (!compiledJavascriptPath) {
    return null;
  }

  // NOTE - This is a bit of an optimization. We're reading the file contents into memory
  // before passing them to findSourceFunction. This allows us to avoid a multiple reads
  // of the files in findSourceFunction.
  const jsFilePath = path.join(compiledJavascriptPath, "index.js");
  const mapFile = `${jsFilePath}.map`;
  const sourceMapContent = JSON.parse(
    await fs.promises.readFile(mapFile, { encoding: "utf8" }),
  );
  const jsFileContents = await fs.promises.readFile(jsFilePath, {
    encoding: "utf8",
  });

  // const truncatedFunctionString = functionString.slice(0, 100);
  // console.time(`findSourceFunction: ${truncatedFunctionString}`);
  const sourceFunction = await findSourceFunctions(
    jsFilePath,
    functionString,
    true,
    {
      sourceMapContent,
      jsFileContents,
    },
  );
  // console.timeEnd(`findSourceFunction: ${truncatedFunctionString}`);
  return {
    text: sourceFunction?.[0]?.sourceFunction ?? null,
    sourceFile: sourceFunction?.[0]?.sourceFile ?? null,
  };
}

/**
 * Finds the directory containing the compiled JavaScript files generated by Wrangler.
 *
 * @param {string} projectPath - The path to the project directory.
 * @returns {string | null} The path to the compiled JavaScript directory if found, otherwise null.
 */
export function findWranglerCompiledJavascriptDir(
  projectPath: string,
): string | null {
  const wranglerTmpPath = findWranglerTmp(projectPath);
  if (!wranglerTmpPath) {
    return null;
  }

  // Get all directories in tmp that start with 'dev'
  const devDirs = fs
    .readdirSync(wranglerTmpPath)
    .filter(
      (dir) =>
        dir.startsWith("dev") &&
        fs.statSync(path.join(wranglerTmpPath, dir)).isDirectory(),
    )
    .map((dir) => path.join(wranglerTmpPath, dir));

  // Sort directories by modification time (most recent first)
  devDirs.sort(
    (a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime(),
  );

  // Find the first directory that contains both 'index.js' and 'index.js.map'
  for (const dir of devDirs) {
    const indexJs = path.join(dir, "index.js");
    const indexJsMap = path.join(dir, "index.js.map");
    if (fs.existsSync(indexJs) && fs.existsSync(indexJsMap)) {
      return dir;
    }
  }

  logger.debug(
    "[findCompiledJavascript] No compiled JavaScript found in .wrangler/tmp/dev* directories",
  );
  return null;
}

/**
 * Locates the `.wrangler/tmp` directory within the specified project path.
 *
 * @param {string} projectPath - The path to the project directory.
 * @returns {string | null} The path to the `.wrangler/tmp` directory if found, otherwise null.
 */
function findWranglerTmp(projectPath: string): string | null {
  const wranglerTmpPath = path.join(projectPath, ".wrangler", "tmp");

  try {
    const stats = fs.statSync(wranglerTmpPath);
    if (stats.isDirectory()) {
      return wranglerTmpPath;
    }
  } catch (_error) {
    // Directory doesn't exist or is not accessible
    logger.debug(
      `[findWranglerTmp] .wrangler/tmp directory doesn't exist or is not accessible: ${wranglerTmpPath}`,
    );
    return null;
  }

  logger.debug(`.wrangler/tmp could not be found in ${projectPath}`);
  return null;
}
