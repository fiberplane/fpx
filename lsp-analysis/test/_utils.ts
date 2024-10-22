import type { MessageConnection } from "vscode-jsonrpc";
import type {
  CodeLensParams,
  Definition,
  DefinitionParams,
  Location,
  Position,
  ReferenceParams,
} from "vscode-languageserver-protocol";
import { logger } from "../src";
import { isDefinitionsArray } from "../src/types";
import { getFileUri } from "../src/utils";

export function sendReferencesRequest(
  connection: MessageConnection,
  fileUri: string,
  position: { line: number; character: number },
): Promise<Array<Location>> {
  const params: ReferenceParams = {
    textDocument: {
      uri: fileUri,
    },
    position: {
      line: position.line, // Line number where the symbol is located
      character: position.character, // Character position of the symbol
    },
    context: {
      includeDeclaration: false,
    },
  };

  return connection.sendRequest("textDocument/references", params) as Promise<
    Array<Location>
  >;
}

export function sendDefinitionRequest(
  connection: MessageConnection,
  fileUri: string,
  position: { line: number; character: number },
): Promise<Array<Location>> {
  const params: DefinitionParams = {
    textDocument: {
      uri: fileUri,
    },
    position: {
      line: position.line,
      character: position.character,
    },
  };

  return connection.sendRequest("textDocument/definition", params) as Promise<
    Array<Location>
  >;
}

export function getWordAtLocation(
  content: string,
  position: { line: number; character: number },
): string {
  const lines = content.split("\n");
  const line = lines[position.line];
  const words = line.substring(position.character).split(" ");
  return words[0];
}

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
 * Retrieve the location of the definition of the symbol at the given position in the TypeScript file.
 */
export async function getTsSourceDefinition(
  connection: MessageConnection,
  filePath: string,
  position: Position,
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

export async function codeLens(connection: MessageConnection, fileUri: string) {
  const params: CodeLensParams = {
    textDocument: {
      uri: fileUri,
    },
  };

  console.log("codeLens for", fileUri);

  const result = await connection.sendRequest("textDocument/codeLens", params);
  // await connection.sendRequest("codeLens/resolve", result[0]);
  console.log("result", result);
  return result;
}
