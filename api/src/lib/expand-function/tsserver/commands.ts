import fs from "node:fs";
import type ts from "typescript";
import type { MessageConnection } from "vscode-jsonrpc";
import logger from "../../../logger.js";
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

export async function getDefinition(
  connection: MessageConnection,
  fileUri: string,
  position: ts.LineAndCharacter,
  identifierName?: string,
) {
  const definitionResponse = await connection.sendRequest(
    "textDocument/definition",
    {
      textDocument: { uri: fileUri },
      position: position,
    },
  );

  if (identifierName) {
    logger.debug(
      `[debug] TS Lang Server definition response for ${identifierName}:`,
      JSON.stringify(definitionResponse, null, 2),
    );
  }

  // INVESTIGATE - When is definitionResponse longer than 1?
  if (Array.isArray(definitionResponse) && definitionResponse.length > 0) {
    return definitionResponse[0];
  }

  return null;
}
