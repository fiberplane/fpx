import fs from "node:fs";
import type ts from "typescript";
import type { MessageConnection } from "vscode-jsonrpc";
import logger from "../../../logger.js";
import { type Definition, isDefinitionsArray } from "./types.js";
import { getFileUri } from "./utils.js";

export async function openFile(
  connection: MessageConnection,
  filePath: string,
) {
  const fileUri = getFileUri(filePath);
  // TODO - Check if we need to read the content of the file... shouldn't the server know how to do this from the workspace configuration?
  const fileContent = fs.readFileSync(filePath, "utf-8");
  await connection.sendNotification("textDocument/didOpen", {
    textDocument: {
      uri: fileUri,
      languageId: "typescript",
      version: 1,
      text: fileContent,
    },
  });

  logger.debug("[debug] Opened document:", fileUri);
}

/**
 * Get the source definition of a TypeScript file at a given position by executing
 * the Language Server Protocol (LSP) workspace/executeCommand command, specifically
 * the _typescript.goToSourceDefinition command.
 *
 * This function differs from executing the LSP textDocument/definition command (see {@link getTextDocumentDefinition}) in that
 * it retrieves the source definition, which is the original location where a symbol is defined,
 * rather than just the location where it is referenced or declared.
 *
 * @param connection - The TypeScript server connection.
 * @param filePath - The path to the TypeScript file.
 * @param position - The position in the file to get the source definition for.
 * @returns The source definition location or null if not found.
 */
export async function getTsSourceDefinition(
  connection: MessageConnection,
  filePath: string,
  position: ts.LineAndCharacter,
): Promise<Definition | null> {
  const fileUri = getFileUri(filePath);

  const sourceDefinition = await executeCommand(
    connection,
    "_typescript.goToSourceDefinition",
    [fileUri, position],
  );

  // INVESTIGATE - When is definitionResponse longer than 1?
  if (isDefinitionsArray(sourceDefinition)) {
    return sourceDefinition[0] ?? null;
  }

  logger.warn(
    `[warning] getTsSourceDefinition returned an unexpected, unparseable response: ${sourceDefinition}`,
  );

  return null;
}

/**
 * Execute a command on the TypeScript server.
 *
 * This is useful for non-standard LSP commands that the TypeScript server
 * supports. (E.g., the _typescript.goToSourceDefinition command.)
 *
 * @param connection - The TypeScript server connection.
 * @param command - The command to execute.
 * @param args - The arguments to pass to the command.
 * @returns The response from the server.
 */
export async function executeCommand(
  connection: MessageConnection,
  command: string,
  args: unknown[],
) {
  try {
    const response = await connection.sendRequest("workspace/executeCommand", {
      command: command,
      arguments: args,
    });
    return response;
  } catch (error) {
    logger.error(
      `Error with 'workspace/executeCommand' for command: ${command} with args: ${JSON.stringify(args, null, 2)}`,
      error,
    );
    return null;
  }
}

/**
 * Get the definition of a TypeScript file at a given position by executing
 * the Language Server Protocol (LSP) textDocument/definition command.
 *
 * This function retrieves the location where a symbol is defined within the TypeScript file,
 * which can be useful for navigating to the definition of a symbol from its usage.
 *
 * @param connection - The TypeScript server connection.
 * @param fileUri - The URI of the TypeScript file.
 * @param position - The position in the file to get the definition for.
 * @returns The definition location or null if not found.
 */
export async function getTextDocumentDefinition(
  connection: MessageConnection,
  fileUri: string,
  position: ts.LineAndCharacter,
): Promise<Definition | null> {
  const definitionResponse = await connection.sendRequest(
    "textDocument/definition",
    {
      textDocument: { uri: fileUri },
      position: position,
    },
  );

  // INVESTIGATE - When is definitionResponse longer than 1?
  if (isDefinitionsArray(definitionResponse)) {
    return definitionResponse[0] ?? null;
  }

  logger.warn(
    `[warning] getTextDocumentDefinition returned an unexpected, unparseable response: ${definitionResponse}`,
  );

  return null;
}
