import { spawn } from "node:child_process";
import {
  StreamMessageReader,
  StreamMessageWriter,
  createMessageConnection,
} from "vscode-jsonrpc/node.js";
import logger from "../../../logger.js";
import { getFileUri } from "./utils.js";
// import path from "node:path";

export async function getTSServer(pathToProject: string) {
  logger.debug(`[debug]Initializing TS Server for project: ${pathToProject}`);

  const tsServer = spawn("npx", ["typescript-language-server", "--stdio"], {
    // NOTE - This will have latency if the user has not yet downloaded typescript-language-server dependency before via npx...
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

    // NOTE - Does not implement workspace/configuration messages
    //
    // const configResponse = await connection.sendRequest("workspace/configuration", {
    //   items: [{ scopeUri: rootUri, section: "typescript" }],
    // });

    // console.log("TS Server Configuration:", configResponse);

    // Listen for diagnostics
    connection.onNotification("textDocument/publishDiagnostics", (params) => {
      const { uri, diagnostics } = params;
      if (diagnostics.length > 0) {
        console.warn(`Diagnostics for ${uri}:`);
        // biome-ignore lint/complexity/noForEach: <explanation>
        diagnostics.forEach((diag) => {
          console.warn(
            `- [${diag.severity}] ${diag.message} at ${diag.range.start.line}:${diag.range.start.character}`,
          );
        });
      } else {
        console.log(`No diagnostics for ${uri}.`);
      }
    });

    // Listen for log messages
    connection.onNotification("window/logMessage", (params) => {
      const { type, message } = params;
      console.log(`Log Message [${type}]: ${message}`);
    });

    // Listen for show messages
    connection.onNotification("window/showMessage", (params) => {
      const { type, message } = params;
      console.log(`Show Message [${type}]: ${message}`);
    });

    return { connection, tsServer };
  } catch (error) {
    logger.error("Error initializing TS Server:", error);
    throw error;
  }
}
