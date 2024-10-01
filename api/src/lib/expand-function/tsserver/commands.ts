import fs from "node:fs";
import type ts from "typescript";
import type { MessageConnection } from "vscode-jsonrpc";
import logger from "../../../logger.js";
import { type Definition, isDefinitionsArray } from "./types.js";
import { getFileUri } from "./utils.js";

// Modify the openedFiles Map to store the version number
const openedFiles = new Map<string, { content: string; version: number }>();

export async function openFile(
  connection: MessageConnection,
  filePath: string,
) {
  const fileUri = getFileUri(filePath);
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const existingFile = openedFiles.get(filePath);
  if (existingFile && existingFile.content === fileContent) {
    logger.debug("[debug] [openFile] File already opened:", filePath);
    return;
  }

  const version = (existingFile?.version ?? 0) + 1;

  await connection.sendNotification("textDocument/didOpen", {
    textDocument: {
      uri: fileUri,
      languageId: "typescript",
      version: version,
      text: fileContent,
    },
  });
  openedFiles.set(filePath, { content: fileContent, version });
}

export async function updateFile(
  connection: MessageConnection,
  filePath: string,
) {
  const fileUri = getFileUri(filePath);
  const newContent = fs.readFileSync(filePath, "utf-8");

  const existingFile = openedFiles.get(filePath);
  if (!existingFile) {
    logger.warn(
      "[warn] Attempting to update a file that wasn't opened:",
      filePath,
    );
    return await openFile(connection, filePath);
  }

  if (existingFile.content === newContent) {
    // logger.debug("[debug] [updateFile] File content unchanged:", filePath);
    return;
  }

  const newVersion = existingFile.version + 1;

  await connection.sendNotification("textDocument/didChange", {
    textDocument: {
      uri: fileUri,
      version: newVersion,
    },
    contentChanges: [{ text: newContent }],
  });
  openedFiles.set(filePath, { content: newContent, version: newVersion });
  logger.debug("[debug] Updated document:", fileUri);
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
