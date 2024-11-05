export class NodeTypeNotSupportedError extends Error {
    fileName;
    line;
    character;
    text;
    kind;
    constructor(node) {
        const { fileName, line, character, text, kind } = NodeTypeNotSupportedError.extractNodeMetadata(node);
        const message = `Node of kind ${kind} is not supported at ${fileName}:${line}:${character}\nNode text: ${text}`;
        super(message);
        this.name = "NodeTypeNotSupportedError";
        this.fileName = fileName;
        this.line = line;
        this.character = character;
        this.text = text;
        this.kind = kind;
    }
    static extractNodeMetadata(node) {
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
