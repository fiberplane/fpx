import path from "node:path";
import { fileURLToPath } from "node:url";
import util from "node:util";
import { expandFunction } from "../expand-function.js";
import { getTSServer } from "../tsserver/server.js";
import { debug } from "node:console";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(
  __dirname,
  "../../../../../examples/test-static-analysis",
);

const _functionWithConstant = `(c) => {
  const auth = c.req.header("Authorization");
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
}`.trim();

const _functionWithHelper = `(c) => {
  const shouldSayHello = helperFunction(c.req);
  return c.text(shouldSayHello ? "Hello Helper Function!" : "Helper Function");
}`.trim();

const functionWithHelperInAnotherFile = `(c) => {
  const auth = getAuthHeader(c.req);
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
}`.trim();

async function main() {
  try {
    // await tsServerTest();
    const result = await expandFunction(
      projectRoot,
      functionWithHelperInAnotherFile,
      { debug: true },
    );
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});

export async function tsServerTest() {
  const { connection } = await getTSServer(projectRoot);
  // debugger;
  const fileUri = `file://${path.resolve(projectRoot, "src/index.ts")}`;
  console.log("fileUri", fileUri);

  const response = await connection.sendRequest("textDocument/definition", {
    textDocument: { uri: fileUri },
    position: { line: 0, character: 10 },
  });

  console.log("Definition response:", util.inspect(response, { depth: null }));

  const referencesResponse = await connection.sendRequest(
    "textDocument/references",
    {
      textDocument: { uri: fileUri },
      position: { line: 6, character: 13 },
    },
  );

  console.log(
    "References response:",
    util.inspect(referencesResponse, { depth: null }),
  );
}
