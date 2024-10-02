import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { analyzeOutOfScopeIdentifiers } from "./identifier-analyzer.js";

function createSourceFile(content: string): ts.SourceFile {
  return ts.createSourceFile("test.ts", content, ts.ScriptTarget.Latest, true);
}

function getFunctionNode(
  sourceFile: ts.SourceFile,
): ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression {
  let functionNode:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression
    | undefined;

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node)) {
      functionNode = node;
    } else if (ts.isVariableStatement(node)) {
      ts.forEachChild(node.declarationList, (declaration) => {
        if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
          if (ts.isArrowFunction(declaration.initializer)) {
            functionNode = declaration.initializer;
          } else if (ts.isFunctionExpression(declaration.initializer)) {
            functionNode = declaration.initializer;
          }
        }
      });
    }
  });

  if (!functionNode) {
    throw new Error("No function node found in the source file");
  }

  return functionNode;
}

describe("analyzeOutOfScopeIdentifiers", () => {
  it("should identify out-of-scope variables", () => {
    const source = `
      function test() {
        console.log(outOfScope);
        const localVar = 1;
        console.log(localVar);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "outOfScope",
          position: expect.objectContaining({ line: 2, character: 20 }),
        }),
        expect.objectContaining({ name: "console" }),
        expect.objectContaining({ name: "log" }),
      ]),
    );
  });

  it("should handle arrow functions", () => {
    const source = `
      const test = () => {
        console.log(outOfScope);
        const localVar = 1;
        console.log(localVar);
      };
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "outOfScope" }),
        expect.objectContaining({ name: "console" }),
        expect.objectContaining({ name: "log" }),
      ]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "test" }),
        expect.objectContaining({ name: "localVar" }),
      ]),
    );
  });

  it("should handle function parameters", () => {
    const source = `
      function test(param1, param2) {
        console.log(param1, param2, outOfScope);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "outOfScope" }),
        expect.objectContaining({ name: "log" }),
        expect.objectContaining({ name: "console" }),
      ]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "param1" }),
        expect.objectContaining({ name: "param2" }),
      ]),
    );
  });

  it("should handle property access expressions correctly", () => {
    const source = `
      function test() {
        const arg3 = 3;
        console.log(obj.property);
        globalObject.someMethod(arg1, arg2, arg3);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "console" }),
        expect.objectContaining({ name: "log" }),
        expect.objectContaining({ name: "obj" }),
        expect.objectContaining({ name: "property" }),
        expect.objectContaining({ name: "globalObject" }),
        expect.objectContaining({ name: "someMethod" }),
        expect.objectContaining({ name: "arg1" }),
        expect.objectContaining({ name: "arg2" }),
      ]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "test" }),
        expect.objectContaining({ name: "arg3" }),
      ]),
    );
  });

  it("should not return a parent function declaration's name", () => {
    const source = "function outer() {}";
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "outer" })]),
    );
  });

  it("should handle nested functions", () => {
    const source = `
      function outer() {
        const outerVar = 1;
        function inner() {
          return meh;
        }
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "meh" })]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "inner" }),
        expect.objectContaining({ name: "outer" }),
        expect.objectContaining({ name: "outerVar" }),
      ]),
    );
  });

  it("should handle complex scenarios", () => {
    const source = `
      function complex(param1) {
        const local1 = outOfScope1;
        let local2 = param1 + outOfScope2;
        
        function inner() {
          const innerLocal = local1 + outOfScope3;
          return innerLocal + local2 + outOfScope4;
        }
        
        return inner() + obj.property + outOfScope5;
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "outOfScope1" }),
        expect.objectContaining({ name: "outOfScope2" }),
        expect.objectContaining({ name: "outOfScope3" }),
        expect.objectContaining({ name: "outOfScope4" }),
        expect.objectContaining({ name: "outOfScope5" }),
        expect.objectContaining({ name: "obj" }),
        expect.objectContaining({ name: "property" }),
      ]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "inner" }),
        expect.objectContaining({ name: "local1" }),
        expect.objectContaining({ name: "local2" }),
        expect.objectContaining({ name: "param1" }),
      ]),
    );
  });

  it("should consider destructured variables from in-scope identifiers as local scope", () => {
    const source = `
      function test(c) {
        const { shouldHonk } = c.req.query();
        const honk = typeof shouldHonk !== "undefined" ? "Honk honk!" : "";
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "c" }),
        expect.objectContaining({ name: "req" }),
        expect.objectContaining({ name: "query" }),
        expect.objectContaining({ name: "shouldHonk" }),
        expect.objectContaining({ name: "honk" }),
      ]),
    );
  });

  it.only("should not consider parameters of functions defined within the function as out of scope", () => {
    const source = `
      function test(userId, eventId) {
        webhooks.on(
          ["issues.opened", "star.created", "watch.started"],
          async ({ payload, name }) => {  
            await db.insert(events).values({
              eventId,
              eventAction: payload.action,
              eventName: name,
              repoId: payload.repository.id,
              userId,
            });
          }
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "db" }),
        expect.objectContaining({ name: "insert" }),
        expect.objectContaining({ name: "values" }),
        expect.objectContaining({ name: "webhooks" }),
        expect.objectContaining({ name: "events" }),
      ]),
    );

    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "test" }),
        expect.objectContaining({ name: "userId" }),
        expect.objectContaining({ name: "eventId" }),
        expect.objectContaining({ name: "payload" }),
        expect.objectContaining({ name: "action" }),
        expect.objectContaining({ name: "repository" }),
        expect.objectContaining({ name: "id" }),
        expect.objectContaining({ name: "name" }),
      ]),
    );
  });
});
