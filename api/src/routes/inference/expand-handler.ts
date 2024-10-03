import * as fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { USER_PROJECT_ROOT_DIR } from "../../constants.js";
import {
  type ExpandedFunctionContext,
  type ExpandedFunctionResult,
  expandFunction,
  findWranglerCompiledJavascriptDir,
} from "../../lib/expand-function/index.js";
import {
  type FindSourceFunctionsResult,
  type SourceFunctionResult,
  findSourceFunctions,
} from "../../lib/find-source-function/index.js";
import logger from "../../logger.js";

export async function expandHandler(
  handler: string,
  middleware: Array<{ handler: string }>,
) {
  const projectPath = USER_PROJECT_ROOT_DIR;
  const compiledJavascriptPath = findWranglerCompiledJavascriptDir(projectPath);
  if (!compiledJavascriptPath) {
    return [null, null];
  }

  // NOTE - This is an optimization.
  //        We're reading the compiled js file contents into memory, along with the source map,
  //        before passing them to findSourceFunction.
  //        This allows us to avoid multiple reads of these files in findSourceFunction.
  //        (Parsing a mid-sized source map into JSON takes ~10ms)
  const jsFilePath = path.join(compiledJavascriptPath, "index.js");
  const { jsFileContents, sourceMapContent } = await getSourceFiles(jsFilePath);

  // HACK - We filter out certian third-party middleware in this function, to reduce the amount of work done here
  const filteredMiddleware = filterHonoMiddleware(middleware);

  const functionDefinitions = [
    handler,
    ...filteredMiddleware.map(({ handler }) => handler),
  ];

  const sourceFunctions = await findSourceFunctions(
    jsFileContents,
    functionDefinitions,
    true,
    {
      sourceMapContent,
      jsFileContents,
    },
  );

  // TODO - Handle case where no source functions are found, fall back to inefficient search

  const handlerSourceFunction =
    sourceFunctions.find(
      (sourceFunction) => sourceFunction.functionText === handler,
    ) ?? null;

  const middlewareSourceFunctions = sourceFunctions.filter((sourceFunction) => {
    // TODO - Filter out or transform node modules middleware?
    const isMiddleware = filteredMiddleware.some(
      (middleware) => middleware.handler === sourceFunction.functionText,
    );
    return isMiddleware;
  });

  return buildAiContext(handlerSourceFunction, middlewareSourceFunctions);
}

async function buildAiContext(
  handler: SourceFunctionResult | null,
  middleware: FindSourceFunctionsResult,
) {
  const handlerContextPromise = handler
    ? buildHandlerContext(handler)
    : Promise.resolve(undefined);

  const middlewareContextPromise = middleware
    ? buildMiddlewareContext(middleware)
    : Promise.resolve(undefined);

  return Promise.all([handlerContextPromise, middlewareContextPromise]);
}

async function buildHandlerContext(handler: SourceFunctionResult) {
  if (handler?.sourceFunction) {
    const expandedFunction = await expandFunctionInUserProject(handler);
    return transformExpandedFunction(expandedFunction);
  }
  return undefined;
}

/**
 * Build the middleware context from the middleware functions.
 *
 * Recursively expands middleware functions' out of scope identifiers
 * and transforms them into a string that can be used in the LLM's context.
 *
 * @param middleware - The middleware functions
 * @returns The middleware context
 */
async function buildMiddlewareContext(
  middleware: FindSourceFunctionsResult,
): Promise<string | undefined> {
  if (!middleware || !middleware.length) {
    return undefined;
  }

  const expandedMiddleware = await Promise.all(
    middleware.map((m) => {
      return expandFunctionInUserProject(m);
    }),
  );

  return `<middleware>
${expandedMiddleware.map(transformExpandedFunction).join("\n")}
</middleware>`;
}

/**
 * Expand a handler function's out-of-scope identifiers to help with ai request generation
 *
 * This is a convenience wrapper around expandFunction that assumes the user's project root is the current working directory or FPX_WATCH_DIR
 *
 * @param handler - The result of mapping the handler function back to the original source code
 * @returns The handler function location with certain out-of-scope identifiers expanded
 */
async function expandFunctionInUserProject(handler: SourceFunctionResult) {
  // NOTE - If the handler is in node_modules, we can skip the expansion (an optimization)
  if (handler.source?.includes("node_modules")) {
    return null;
  }

  const projectRoot = USER_PROJECT_ROOT_DIR;
  const functionText = handler.functionText;
  const truncatedHandler = functionText.replace(/\n/g, " ").slice(0, 33);
  logger.debug(
    chalk.dim(
      `Expanding function ${truncatedHandler}... in project root ${projectRoot}`,
    ),
  );

  const hints = {
    sourceFunction: handler.sourceFunction,
    sourceFile: handler.source,
  };

  const expandedFunction = await expandFunction(projectRoot, functionText, {
    skipSourceMap: true,
    hints,
  });

  return expandedFunction;
}

/**
 * Transform the expanded function into a string that can be used in the LLM's context.
 *
 * @param expandedFunction - The expanded function context
 * @returns The transformed expanded function context
 */
function transformExpandedFunction(
  expandedFunction: ExpandedFunctionResult | null,
): string | undefined {
  if (!expandedFunction || !expandedFunction.context?.length) {
    return undefined;
  }

  function stringifyContext(
    context: ExpandedFunctionContext,
    depth = 0,
  ): string {
    return context
      .map((entry) => {
        const indent = "  ".repeat(depth);
        const filename = entry.definition?.uri
          ? ` filename="${path.basename(entry.definition.uri)}"`
          : "";
        let result = `${indent}<entry>
${indent}  <name${filename}>${entry.name}</name>`;

        if (entry.definition?.text) {
          result += `
${indent}  <definition>
${indent}    ${entry.definition.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim().split("\n").join(`\n${indent}    `)}
${indent}  </definition>`;
        }

        if (entry.package) {
          result += `
${indent}  <package>${entry.package}</package>`;
        }

        if (entry.context && entry.context.length > 0) {
          result += `
${indent}  <context>
${stringifyContext(entry.context, depth + 2)}
${indent}  </context>`;
        }

        result += `
${indent}</entry>`;

        return result;
      })
      .join("\n");
  }

  return `<expanded-function>
${stringifyContext(expandedFunction.context)}
</expanded-function>`;
}

// HACK - Ignore expansion of reactRenderer middleware, since it's from a third party library
//        We could also be clever and ignore a bunch of other third party Hono middleware by default to avoid too much work being done here
function filterHonoMiddleware(middleware: Array<{ handler: string }>) {
  return middleware.filter((m) => {
    const functionText = m.handler;
    return !functionText.startsWith("function reactRenderer");
  });
}

async function getSourceFiles(jsFilePath: string) {
  const [jsFileContents, sourceMapContent] = await Promise.all([
    fs.promises.readFile(jsFilePath, { encoding: "utf8" }),
    getSourceMap(jsFilePath),
  ]);
  return { jsFileContents, sourceMapContent };
}

async function getSourceMap(jsFilePath: string) {
  try {
    const mapFile = `${jsFilePath}.map`;
    const sourceMapContent = JSON.parse(
      await fs.promises.readFile(mapFile, { encoding: "utf8" }),
    );
    return sourceMapContent;
  } catch (_error) {
    logger.error(`Failed to parse source map for ${jsFilePath}`);
    return null;
  }
}
