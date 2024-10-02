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
  it("should identify an out-of-scope variable", () => {
    const source = `
      function test() {
        console.log(outOfScope);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "outOfScope",
        }),
      ]),
    );
  });

  it("should identify `console` and `log` (from `console.log`) both as out-of-scope identifiers", () => {
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

  it("should NOT identify a locally declared const, var, or let as out-of-scope identifiers", () => {
    const source = `
      function test() {
        console.log(outOfScope);
        const localConst = 1;
        var localVar = 2;
        let localLet = 3;
        console.log(localConst, localVar, localLet);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    const forbiddenNames = ["localConst", "localVar", "localLet"];
    for (const name of forbiddenNames) {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    }
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

    const forbiddenNames = ["test", "localVar"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
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

    const forbiddenNames = ["param1", "param2"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
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

    const forbiddenNames = ["test", "arg3"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
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

  // TODO - Factor out into simpler unit tests
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

    const forbiddenNames = ["inner", "local1", "local2", "param1"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
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

    // expect(result).not.toEqual(
    //   expect.arrayContaining([
    //     expect.objectContaining({ name: "c" }),
    //     expect.objectContaining({ name: "req" }),
    //     expect.objectContaining({ name: "query" }),
    //     expect.objectContaining({ name: "shouldHonk" }),
    //     expect.objectContaining({ name: "honk" }),
    //   ]),
    // );

    const forbiddenNames = ["c", "req", "query", "shouldHonk", "honk"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
  });

  describe("nested functions", () => {
    it("should return out of scope identifiers from nested functions, but not the nested function's name", () => {
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

      const forbiddenNames = ["inner", "outer", "outerVar"];
      // biome-ignore lint/complexity/noForEach: <explanation>
      forbiddenNames.forEach((name) => {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      });
    });

    it("should not consider parameters of functions defined within the function as out of scope", () => {
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

      const forbiddenNames = [
        "test",
        "userId",
        "eventId",
        "payload",
        "action",
        "repository",
        "id",
        "name",
      ];
      // biome-ignore lint/complexity/noForEach: <explanation>
      forbiddenNames.forEach((name) => {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      });
    });
  });
});
