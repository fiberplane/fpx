import type { TsNode, TsSyntaxKind } from "../types";

export class NodeTypeNotSupportedError extends Error {
  fileName: string;
  line: number;
  character: number;
  text: string;
  kind: TsSyntaxKind;

  constructor(node: TsNode) {
    const { fileName, line, character, text, kind } =
      NodeTypeNotSupportedError.extractNodeMetadata(node);
    const message = `Node of kind ${kind} is not supported at ${fileName}:${line}:${character}\nNode text: ${text}`;
    super(message);
    this.name = "NodeTypeNotSupportedError";
    this.fileName = fileName;
    this.line = line;
    this.character = character;
    this.text = text;
    this.kind = kind;
  }

  private static extractNodeMetadata(node: TsNode) {
    const fileName = node.getSourceFile().fileName;
    const { line, character } = node
      .getSourceFile()
      .getLineAndCharacterOfPosition(node.getStart());
    const text = node.getText();
    const kind = node.kind;
    return { fileName, line, character, text, kind };
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}
