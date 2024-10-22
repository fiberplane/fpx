/**
 * This file contains the TypeScript language server instance and related functions.
 * It uses the `vscode-jsonrpc` library to create a connection to the language server
 * and handles the initialization, notification registration, and cleanup.
 *
 * Note that the language server is initialized in the user's project directory by spawning a child process,
 * and running `npx typescript-language-server --stdio`.
 * We interface with that process via stdin/stdout.
 */

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { resolve } from "node:path";
import {
  type MessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  createMessageConnection,
} from "vscode-jsonrpc/node.js";
import type {
  ConfigurationParams,
  DidChangeConfigurationParams,
  //   // createMessageConnection,
  InitializeParams,
} from "vscode-languageserver-protocol";
import { logger } from "./logger.js";
import { isPublishDiagnosticsParams } from "./types";
import { getFileUri } from "./utils";
// import { connect } from "node:http2";

// let tsServerInstance: {
//   connection: MessageConnection;
//   tsServer: ChildProcessWithoutNullStreams;
// } | null = null;

/**
 * Retrieves the TypeScript language server instance for a given project path.
 * If an instance already exists, it will be reused to avoid unnecessary initialization.
 *
 * @param {string} pathToProject - The path to the project directory.
 * @returns {Promise<{ connection: MessageConnection; tsServer: ChildProcessWithoutNullStreams }>} The TypeScript language server instance.
 */
export async function getTSServer(pathToProject: string) {
  const resolvedPath = resolve(pathToProject);

  // if (tsServerInstance) {
  //   // logger.debug(
  //   //   chalk.dim(
  //   //     `[debug] Reusing existing TS Server instance for project: ${resolvedPath}`,
  //   //   ),
  //   // );
  //   return tsServerInstance;
  // }

  return await initializeTSServer(resolvedPath);
  // return tsServerInstance;
}

async function initializeTSServer(pathToProject: string) {
  logger.debug(`Initializing TS Server for project: ${pathToProject}`);

  const tsServer = spawn(
    "npx",
    [
      "typescript-language-server",
      "--log-level",
      "verbose",
      // "--logVerbosity=verbose",
      "--stdio",
      // "--tsserver-log-file",
      // "out.log",
    ],
    {
      // NOTE - This will add quite a bit of startup time if the user has not yet downloaded typescript-language-server dependency before via npx...
      //        And I haven't tested what that overhead is...
      // NOTE - We *could* run the language server in the project root (via cwd switch), but I think we handle this by initializing the language server
      //        and pointing it to the project root below anyhow.
      // cwd: pathToProject,
      shell: true,
    },
  );

  // Terminate the language server when the Node.js process exits
  process.on("exit", () => {
    logger.debug(
      `[debug] Terminating TS Server instance for project: ${pathToProject}`,
    );
    tsServer.kill();
  });

  // NOTE - Uncomment to debug raw output of ts-language-server
  //
  tsServer.stdout.on("data", (data) => {
    // console.log("<TS-SERVER-DATA>");
    console.log(`--> tsServer stdout: ${data.toString()}`);
    // logger.box(`tsServer stdout: ${data.toString()}`);
    // console.log("</TS-SERVER-DATA>");
  });

  // tsServer.stderr.on("data", (data) => {
  //   logger.error(`tsserver stderr: ${data.toString()}`);
  // });

  tsServer.stdout.on("data", (data) => {
    logger.trace(`tsserver stdout: ${data.toString()}`);
  });

  const connection = createMessageConnection(
    new StreamMessageReader(tsServer.stdout),
    new StreamMessageWriter(tsServer.stdin),
  );

  connection.listen();

  tsServer.on("close", (code) => {
    logger.debug(`typescript-language-server process exited with code ${code}`);
  });

  try {
    const rootUri = getFileUri(pathToProject);
    logger.debug(
      `Initializing typescript language server with rootUri: ${rootUri}`,
    );

    // ClientCapabilities
    const params: InitializeParams = {
      processId: process.pid,
      rootUri: rootUri,
      capabilities: {
        workspace: {
          // codeLens: {
          //   // dynamicRegistration: true,
          //   refreshSupport: true,
          // },
          configuration: true,
        },
      },
      workspaceFolders: [{ uri: rootUri, name: "app" }],
      trace: "verbose",

      initializationOptions: {
        typescript: {
          referencesCodeLens: {
            enabled: true,
          },
          implementationsCodeLens: {
            enabled: true,
          },
        },

        preferences: {
          allowIncompleteCompletions: true,
          includeCompletionsForModuleExports: true,
          includeCompletionsWithInsertText: true,
        },
      },
    };

    const ir = await connection.sendRequest("initialize", params);
    console.log("ir", ir);
    await connection.sendNotification("initialized");

    registerNotificationHandlers(connection);
    await new Promise((resolve) => setTimeout(resolve, 200));
    // enable codelens
    const configParams: DidChangeConfigurationParams = {
      settings: {
        asdasdfasd: "erwe",
        // typescript: {
        referencesCodeLens: {
          enabled: true,
        },
        implementationsCodeLens: {
          enabled: true,
        },
        // },
      },
    };
    // const dcc =
    await connection.sendNotification(
      "workspace/didChangeConfiguration",
      configParams,
    );
    // console.log("configUpdate dcc ", dcc);

    // const configQueryParams: ConfigurationParams = {
    //   items: [
    //     {
    //       section: "typescript.referencesCodeLens",
    //     },
    //     {
    //       section: "typescript.implementationsCodeLens",
    //     },
    //   ],
    // };
    // const r = await connection.sendRequest(
    //   "workspace/configuration",
    //   configQueryParams,
    // );
    // console.log("configUpdate", r);

    return { connection, tsServer };
  } catch (error) {
    logger.error("Error initializing TS Server:", error);
    throw error;
  }
}

/**
 * Registers handlers for various notifications from the TypeScript language server.
 *
 * @param {MessageConnection} connection - The connection to the TypeScript language server.
 */
function registerNotificationHandlers(connection: MessageConnection) {
  const logger = console;
  connection.onNotification("textDocument/didOpen", (params) => {
    logger.debug(
      `[textDocument/didOpen] Received definition request: ${JSON.stringify(
        params,
        null,
        2,
      )}`,
    );
  });
  // Listen for diagnostics
  connection.onNotification(
    "textDocument/publishDiagnostics",
    (params: unknown) => {
      if (!isPublishDiagnosticsParams(params)) {
        logger.debug(
          "[debug] Received unexpected params for `textDocument/publishDiagnostics`",
        );
        return;
      }
      const { uri, diagnostics } = params;
      if (diagnostics.length > 0) {
        logger.info(
          `[textDocument/publishDiagnostics] Diagnostics for ${uri}:`,
        );
        for (const diag of diagnostics) {
          logger.info(
            `- [${diag.severity}] ${diag.message} at ${diag.range.start.line}:${diag.range.start.character}`,
          );
        }
      } else {
        logger.debug(
          `[textDocument/publishDiagnostics] No diagnostics for ${uri}.`,
        );
      }
    },
  );

  // Listen for log messages
  connection.onNotification("window/logMessage", (params) => {
    const { type, message } = params;
    logger.info(`[window/logMessage] Log Message [${type}]: ${message}`);
    logger.debug(params);
  });

  // Listen for show messages
  connection.onNotification("window/showMessage", (params) => {
    const { type, message } = params;
    logger.debug(`[window/showMessage] Show Message [${type}]: ${message}`);
  });
}

// type
