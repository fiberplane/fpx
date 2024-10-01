import * as fs from "node:fs";
import * as path from "node:path";
import logger from "../../../logger.js";
import { findSourceFunction } from "../../find-source-function.js";

export async function getSourceFunctionText(
  projectPath: string,
  functionString: string,
): Promise<string | null> {
  const compiledJavascriptPath = findWranglerCompiledJavascriptDir(projectPath);
  if (!compiledJavascriptPath) {
    return null;
  }

  const jsFilePath = path.join(compiledJavascriptPath, "index.js");

  const sourceFunction = await findSourceFunction(jsFilePath, functionString);

  return sourceFunction;
}

function findWranglerCompiledJavascriptDir(projectPath: string): string | null {
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

  logger.warn(
    "[warn] [findCompiledJavascript] No compiled JavaScript found in .wrangler/tmp/dev* directories",
  );
  return null;
}

/**
 * Look for `.wrangler/tmp` folder in the given path
 * @param projectPath The path to the project directory
 * @returns The path to the .wrangler/tmp folder if found, otherwise null
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
    logger.warn(
      `[warn] [findWranglerTmp] .wrangler/tmp directory doesn't exist or is not accessible: ${wranglerTmpPath}`,
    );
    return null;
  }

  logger.info(`.wrangler/tmp could not be found in ${projectPath}`);
  return null;
}
