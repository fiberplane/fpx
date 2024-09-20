import { spawn } from "node:child_process";
import {
  StreamMessageReader,
  StreamMessageWriter,
  createMessageConnection,
} from "vscode-jsonrpc/node.js";

export async function getTSServer(pathToProject: string) {
  console.log(`Initializing TS Server for project: ${pathToProject}`);

  const tsServer = spawn("npx", ["typescript-language-server", "--stdio"]);

  // NOTE - Uncomment to debug raw output of ts-language-server
  //
  // tsServer.stdout.on("data", (data) => {
  //   console.log(`tsServer stdout: ${data.toString()}`);
  // });

  tsServer.stderr.on("data", (data) => {
    console.error(`tsServer stderr: ${data.toString()}`);
  });

  const connection = createMessageConnection(
    new StreamMessageReader(tsServer.stdout),
    new StreamMessageWriter(tsServer.stdin),
  );

  connection.listen();

  tsServer.on("close", (code) => {
    console.log(`tsServer process exited with code ${code}`);
  });

  try {
    const rootUri = `file://${pathToProject.replace(/\\/g, "/")}`;
    console.log(`Initializing with rootUri: ${rootUri}`);

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

    console.log("Initialization response:");
    // console.debug('Initialization response:', JSON.stringify(_response, null, 2));

    await connection.sendNotification("initialized");

    // NOTE - Does not implement workspace/configuration messages
    //
    // const configResponse = await connection.sendRequest("workspace/configuration", {
    //   items: [{ scopeUri: rootUri, section: "typescript" }],
    // });

    // console.log("TS Server Configuration:", configResponse);

    return connection;
  } catch (error) {
    console.error("Error initializing TS Server:", error);
    throw error;
  }
}
