import { spawn } from "node:child_process";
import {
  type MessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  createMessageConnection,
} from "vscode-jsonrpc/node.js";
import logger from "../../../logger.js";
import { isPublishDiagnosticsParams } from "./types.js";
import { getFileUri } from "./utils.js";
// import path from "node:path";

export async function getTSServer(pathToProject: string) {
  logger.debug(`[debug]Initializing TS Server for project: ${pathToProject}`);

  const tsServer = spawn("npx", ["typescript-language-server", "--stdio"], {
    // NOTE - This will add quite a bit of startup time if the user has not yet downloaded typescript-language-server dependency before via npx...
    //        And I haven't tested what that overhead is...
    // NOTE - We *could* run the language server in the project root (via cwd switch), but I think we handle this by initializing the language server
    //        and pointing it to the project root below anyhow.
    // cwd: pathToProject,
    shell: true,
  });

  // NOTE - Uncomment to debug raw output of ts-language-server
  //
  // tsServer.stdout.on("data", (data) => {
  //   console.log("<TS-SERVER-DATA>")
  //   console.log(`tsServer stdout: ${data.toString()}`);
  //   console.log("</TS-SERVER-DATA>")
  // });

  tsServer.stderr.on("data", (data) => {
    logger.error(`tsserver stderr: ${data.toString()}`);
  });

  const connection = createMessageConnection(
    new StreamMessageReader(tsServer.stdout),
    new StreamMessageWriter(tsServer.stdin),
  );

  connection.listen();

  tsServer.on("close", (code) => {
    logger.debug(`tsserver process exited with code ${code}`);
  });

  try {
    const rootUri = getFileUri(pathToProject);
    logger.debug(
      `Initializing typescript language server with rootUri: ${rootUri}`,
    );

    const _response = await connection.sendRequest("initialize", {
      processId: process.pid,
      rootUri: rootUri,
      capabilities: {},
      workspaceFolders: [{ uri: rootUri, name: "app" }],
      initializationOptions: {
        preferences: {
          allowIncompleteCompletions: true,
          includeCompletionsForModuleExports: true,
          includeCompletionsWithInsertText: true,
        },
      },
    });

    logger.debug("Initialization response:");
    // logger.debug('Initialization response:', JSON.stringify(_response, null, 2));

    await connection.sendNotification("initialized");

    registerNotificationHandlers(connection);

    return { connection, tsServer };
  } catch (error) {
    logger.error("Error initializing TS Server:", error);
    throw error;
  }
}

function registerNotificationHandlers(connection: MessageConnection) {
  // Listen for diagnostics
  connection.onNotification("textDocument/publishDiagnostics", (params) => {
    if (!isPublishDiagnosticsParams(params)) {
      logger.debug(
        "[debug] Received unexpected params for `textDocument/publishDiagnostics`",
      );
      return;
    }
    const { uri, diagnostics } = params;
    if (diagnostics.length > 0) {
      logger.info(`[textDocument/publishDiagnostics] Diagnostics for ${uri}:`);
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
  });

  // Listen for log messages
  connection.onNotification("window/logMessage", (params) => {
    const { type, message } = params;
    logger.info(`[window/logMessage] Log Message [${type}]: ${message}`);
  });

  // Listen for show messages
  connection.onNotification("window/showMessage", (params) => {
    const { type, message } = params;
    logger.info(`[window/showMessage] Show Message [${type}]: ${message}`);
  });
}
