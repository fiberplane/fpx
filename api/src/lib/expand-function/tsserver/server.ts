import { spawn } from "node:child_process";
import {
  StreamMessageReader,
  StreamMessageWriter,
  createMessageConnection,
} from "vscode-jsonrpc/node.js";
import logger from "../../../logger.js";

export async function getTSServer(pathToProject: string) {
  logger.debug(`Initializing TS Server for project: ${pathToProject}`);

  const tsServer = spawn("npx", ["typescript-language-server", "--stdio"]);

  // NOTE - Uncomment to debug raw output of ts-language-server
  //
  // tsServer.stdout.on("data", (data) => {
  //   console.log(`tsServer stdout: ${data.toString()}`);
  // });

  tsServer.stderr.on("data", (data) => {
    logger.error(`tsServer stderr: ${data.toString()}`);
  });

  const connection = createMessageConnection(
    new StreamMessageReader(tsServer.stdout),
    new StreamMessageWriter(tsServer.stdin),
  );

  connection.listen();

  tsServer.on("close", (code) => {
    logger.debug(`tsServer process exited with code ${code}`);
  });

  try {
    const rootUri = `file://${pathToProject.replace(/\\/g, "/")}`;
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

    return connection;
  } catch (error) {
    logger.error("Error initializing TS Server:", error);
    throw error;
  }
}
