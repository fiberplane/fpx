import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { analyzeOutOfScopeIdentifiers } from "./identifier-analyzer.js";

function createSourceFile(content: string): ts.SourceFile {
  return ts.createSourceFile("test.ts", content, ts.ScriptTarget.Latest, true);
}

// NOTE - This helper does not parse out anonymous arrow functions
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
    } else if (ts.isExpressionStatement(node)) {
      // Check for anonymous arrow functions
      if (ts.isArrowFunction(node.expression)) {
        functionNode = node.expression;
      }
    }
  });

  if (!functionNode) {
    throw new Error("No function node found in the source file");
  }

  return functionNode;
}

describe("analyzeOutOfScopeIdentifiers", () => {
  it("should NOT return a function declaration's name as out of scope", () => {
    const source = "function outer() {}";
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "outer" })]),
    );
  });
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

  it("should NOT identify locally declared const as an out-of-scope identifier", () => {
    const source = `
      function test() {
        console.log(outOfScope);
        const localConst = 1;
        console.log(localConst);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toContainEqual(
      expect.objectContaining({ name: "localConst" }),
    );
  });

  it("should NOT identify locally declared var as an out-of-scope identifier", () => {
    const source = `
      function test() {
        console.log(outOfScope);
        var localVar = 2;
        console.log(localVar);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toContainEqual(
      expect.objectContaining({ name: "localVar" }),
    );
  });

  it("should NOT identify locally declared `let` as an out-of-scope identifier", () => {
    const source = `
      function test() {
        console.log(outOfScope);
        let localLet = 3;
        console.log(localLet);
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).not.toContainEqual(
      expect.objectContaining({ name: "localLet" }),
    );
  });

  it("should consider Web Standard global like `console` (from `console.log`) as out-of-scope identifier", () => {
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
      expect.arrayContaining([expect.objectContaining({ name: "console" })]),
    );
  });

  describe("arrow functions", () => {
    it("should handle arrow functions assigned to variables", () => {
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
        ]),
      );

      const forbiddenNames = ["test", "localVar"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });
    it("should handle anonymous arrow functions", () => {
      const source = `
      () => {
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
        ]),
      );

      const forbiddenNames = ["localVar"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });
  });

  it("should consider local variables derived from out of scope variables as in scope", () => {
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
      ]),
    );

    const forbiddenNames = ["inner", "local1", "local2", "param1"];
    // biome-ignore lint/complexity/noForEach: <explanation>
    forbiddenNames.forEach((name) => {
      expect(result).not.toContainEqual(expect.objectContaining({ name }));
    });
  });

  // NOTE - We may want to change some of this behavior going forward, but it makes things much simpler for now
  //        Right now we're just going to ignore any properties on a given out-of-scope object.
  //        Doing so could lead to us adding in LOTS of context, e.g., when someone imports an entire module file.
  //        `import * as schema from "./db";`
  //
  //        However, that might be preferable to instead receiving a bunch of identifiers and having to do oodles of lookups.
  //
  describe("property access and destructuring", () => {
    it("should not return identifiers that are used to access object properties", () => {
      const source = `
      function test() {
        console.log(obj.property);
        globalObject.someMethod();
      }
    `;
      const sourceFile = createSourceFile(source);
      const functionNode = getFunctionNode(sourceFile);

      const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "console" }),
          expect.objectContaining({ name: "obj" }),
          expect.objectContaining({ name: "globalObject" }),
        ]),
      );

      const forbiddenNames = ["log", "property", "someMethod"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });

    it("should consider property access expressions on function parameters as in-scope", () => {
      const source = `
      function test(c) {
        const { shouldHonk } = c.req.query();
        const honk = typeof shouldHonk !== "undefined" ? "Honk honk!" : "";
      }
    `;
      const sourceFile = createSourceFile(source);
      const functionNode = getFunctionNode(sourceFile);

      const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

      const forbiddenNames = ["c", "req", "query"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
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

      expect(result).not.toContainEqual(
        expect.objectContaining({ name: "shouldHonk" }),
      );
    });
  });

  // Okay, this doesn't matter too much, since we'd expand OutOfScopeConstants anyhow
  it.skip("should consider destructured variables from out-of-scope identifiers as out of scope", () => {
    const source = `
      function test(_c) {
        const { shouldHonk } = OutOfScopeConstants;
        const honk = typeof shouldHonk !== "undefined" ? "Honk honk!" : "";
      }
    `;
    const sourceFile = createSourceFile(source);
    const functionNode = getFunctionNode(sourceFile);

    const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

    expect(result).toContainEqual(
      expect.objectContaining({ name: "OutOfScopeConstants" }),
    );
    expect(result).toContainEqual(
      expect.objectContaining({ name: "shouldHonk" }),
    );
  });

  describe("function parameters", () => {
    it("should NOT consider function declaration parameters as out-of-scope identifiers", () => {
      const source = `
      function test(param1, param2) {
        console.log(param1, param2, outOfScope);
      }
    `;
      const sourceFile = createSourceFile(source);
      const functionNode = getFunctionNode(sourceFile);

      const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

      const forbiddenNames = ["param1", "param2"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });

    it("should NOT consider function expression parameters as out-of-scope identifiers", () => {
      const source = `
      function(param1, param2) {
        console.log(param1, param2, outOfScope);
      }
    `;
      const sourceFile = createSourceFile(source);
      const functionNode = getFunctionNode(sourceFile);

      const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

      const forbiddenNames = ["param1", "param2"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });

    it("should NOT consider arrow function parameters as out-of-scope identifiers", () => {
      const source = `
      const test = (param1, param2) => {
        console.log(param1, param2, outOfScope);
      }
    `;
      const sourceFile = createSourceFile(source);
      const functionNode = getFunctionNode(sourceFile);

      const result = analyzeOutOfScopeIdentifiers(functionNode, sourceFile);

      const forbiddenNames = ["param1", "param2"];
      for (const name of forbiddenNames) {
        expect(result).not.toContainEqual(expect.objectContaining({ name }));
      }
    });
  });

  describe("nested functions", () => {
    it("should return out of scope identifiers from nested functions, but not the nested function's name", () => {
      const source = `
      function outer() {
        const outerVar = 1;
        function inner() {
          console.log(outerVar);
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
