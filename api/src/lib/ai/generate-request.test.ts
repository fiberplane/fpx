import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";
import type { ToolUseBlock } from "@anthropic-ai/sdk/resources/messages.mjs";
import { CLAUDE_3_5_SONNET } from "@fiberplane/fpx-types";
import { Ajv } from "ajv";
import { describe, expect } from "vitest";
import { transformExpandedFunction } from "../../routes/inference/expand-handler.js";
import { expandFunction } from "../expand-function/expand-function.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool as makeRequestToolBase } from "./tools.js";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path and analyze the 'src' directory
const projectRoot = path.resolve(
  __dirname,
  "../../../../examples/goose-quotes",
);
const srcPath = path.resolve(projectRoot, "src");

const makeRequestTool = {
  name: makeRequestToolBase.function.name,
  description: makeRequestToolBase.function.description,
  input_schema: makeRequestToolBase.function.parameters,
};

// Create json schema validator
const ajv = new Ajv();
const matchesJsonSchema = ajv.compile(makeRequestToolBase.function.parameters);

// We expect the path params to be prefixed with a colon
const validatePathParams = (input: unknown) => {
  if (Object.prototype.hasOwnProperty.call(input, "pathParams")) {
    const pathParams = (input as { pathParams: { key: string }[] }).pathParams;

    for (const { key } of pathParams) {
      const firstChar = key.charAt(0);
      if (firstChar !== ":") {
        return false;
      }
    }
  }
  return true;
};

const apiGeeseHandler = {
  title: "geese handler",
  method: "POST",
  path: "/api/geese",
  handler: `async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Fetching flock leaders");

  const flockLeaders = await measure("getFlockLeaders", () =>
    db.select().from(geese).where(eq(geese.isFlockLeader, true)),
  )();

  console.log(${"`Found ${flockLeaders.length} flock leaders`"});

  return c.json(flockLeaders);
}`,
};

const apiGooseUpdateHandler = {
  title: "goose update handler",
  method: "PUT",
  path: "/api/geese/:id",
  handler: `async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const id = c.req.param("id");
  const updateData = await c.req.json();

  console.log(${"`Updating goose ${id} with data:`"}, updateData);

  const goose = await measure("getGooseById", () => getGooseById(db, +id))();

  if (!goose) {
    console.warn(${"`Goose not found: ${id}`"});
    return c.json({ message: "Goose not found" }, 404);
  }

  // Simulate a race condition by splitting the update into multiple parts
  const updatePromises = Object.entries(updateData).map(
    async ([key, value]) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
      return measure("updateGoose", () =>
        updateGoose(db, +id, { [key]: value }),
      )();
    },
  );

  await Promise.all(updatePromises);

  const updatedGoose = await measure("getGooseById", () =>
    getGooseById(db, +id),
  )();

  console.log(${"`Goose ${id} updated successfully`"});
  return c.json(updatedGoose);
}`,
};

const homeHandler = {
  title: "home handler",
  method: "GET",
  path: "/",
  handler: `(c) => {
  const honk = shouldHonk(c.req) ? "Honk honk!" : "";
  console.log(${"`Home page accessed. Honk: ${honk}`"});
  return c.text(${"`Hello Goose Quotes! ${honk}`"}.trim());
}`,
  validate: (input: unknown) => {
    if (Object.prototype.hasOwnProperty.call(input, "queryParams")) {
      const queryParams = (input as { queryParams: { key: string }[] })
        .queryParams;

      for (const { key } of queryParams) {
        if (key === "shouldHonk") {
          return true;
        }
      }
    }
    return false;
  },
};

const sampleHistory = [
  '<request>\nHTTP/1.1 POST http://localhost:8787/api/geese\nContent-Type: application/json\nUser-Agent: GooseAPI-Tester/1.0\n\n{"name":"Feather Flockington","isFlockLeader":true,"programmingLanguage":"JavaScript","motivations":["coding","leading","honking","...","coding","leading","honking"],"location":{"latitude":51.5074,"longitude":-0.1278}}\n</request>\n<response>\nHTTP/1.1 200\ncontent-encoding: gzip\ncontent-type: application/json; charset=UTF-8\ntransfer-encoding: chunked\n\n[{"id":2,"name":"Feather Flockington","description":"A person named Feather Flockington who talks like a Goose","isFlockLeader":true,"programmingLanguage":"JavaScript","motivations":["coding","leading","honking"],"location":"{\\"latitude\\":51.5074,\\"longitude\\":-0.1278}"},"...",{"id":2,"name":"Feather Flockington","description":"A person named Feather Flockington who talks like a Goose","isFlockLeader":true,"programmingLanguage":"JavaScript","motivations":["coding","leading","honking"],"location":"{\\"latitude\\":51.5074,\\"longitude\\":-0.1278}"}]\n</response>',
];

const testCases: Array<{
  path: string;
  title: string;
  persona: string;
  slimPrompt: boolean;
  handler: string;
  history?: string[];
  method: string;
  validate?: (input: unknown) => boolean;
}> = [
  { persona: "DEV", slimPrompt: false, ...apiGeeseHandler },
  { persona: "QA", slimPrompt: false, ...apiGeeseHandler },
  { persona: "DEV", slimPrompt: true, ...apiGeeseHandler },
  { persona: "QA", slimPrompt: true, ...apiGeeseHandler },
  { persona: "DEV", slimPrompt: false, ...apiGooseUpdateHandler },
  { persona: "QA", slimPrompt: false, ...apiGooseUpdateHandler },
  { persona: "DEV", slimPrompt: true, ...apiGooseUpdateHandler },
  { persona: "QA", slimPrompt: true, ...apiGooseUpdateHandler },
  {
    persona: "DEV",
    slimPrompt: false,
    history: sampleHistory,
    ...apiGooseUpdateHandler,
  },
  {
    persona: "QA",
    slimPrompt: false,
    history: sampleHistory,
    ...apiGooseUpdateHandler,
  },
  {
    persona: "DEV",
    slimPrompt: true,
    history: sampleHistory,
    ...apiGooseUpdateHandler,
  },
  { persona: "QA", slimPrompt: true, ...apiGooseUpdateHandler },
  { persona: "DEV", slimPrompt: false, ...homeHandler },
  { persona: "QA", slimPrompt: false, ...homeHandler },
  { persona: "DEV", slimPrompt: true, ...homeHandler },
  { persona: "QA", slimPrompt: true, ...homeHandler },
];

const KEY_REFERENCE = process.env.ANTHROPIC_API_KEY_REFERENCE;

function getKeyFromOnePassword(reference: string) {
  return new Promise((ok) => {
    const handle = spawn("op", ["read", reference]);
    handle.stdout.on("data", (data) => {
      const token = data.toString();
      ok(token.trim());
    });

    handle.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    handle.on("close", (code) => {
      if (code !== 0) {
        console.error(`child process exited with code ${code}`);
        ok(null);
      }
    });
  });
}

// this test is skipped by default because it is not completely deterministic and requires an API key.
// to securely pass key from 1password (requires cli installed) and run the test,
// pass credential reference as an environment variable:
// ANTHROPIC_API_KEY_REFERENCE="op://Organization/Anthropic API key/credential" pnpm run test src/lib/ai/generate-request.test.ts
describe("generate request", () => {
  for (const {
    persona,
    slimPrompt,
    history,
    handler,
    method,
    path,
    title,
    validate,
  } of testCases) {
    it(
      `${title} (${persona} / ${slimPrompt ? "slim" : "original"}${
        history ? " with history" : ""
      })`,
      { timeout: 20000, skip: !KEY_REFERENCE },
      async () => {
        if (!KEY_REFERENCE) {
          throw new Error("API key reference not set");
        }
        const apiKey = await getKeyFromOnePassword(KEY_REFERENCE);
        if (!apiKey) {
          throw new Error("Failed to get API key");
        }

        const context = await expandFunction(srcPath, handler, {
          skipSourceMap: true,
        });
        const contextAsString = transformExpandedFunction(context);

        const anthropicClient = new Anthropic({ apiKey: String(apiKey) });
        const userPrompt = await invokeRequestGenerationPrompt({
          persona,
          method,
          path,
          handler,
          handlerContext: contextAsString || undefined,
          history,
          openApiSpec: undefined,
          middleware: undefined,
          middlewareContext: undefined,
        });

        const systemPrompt = getSystemPrompt(persona, slimPrompt);

        // check that inputs are same
        expect(userPrompt).toMatchSnapshot();

        const response = await anthropicClient.messages.create({
          model: CLAUDE_3_5_SONNET,
          tool_choice: {
            type: "tool",
            name: makeRequestTool.name,
          },
          tools: [makeRequestTool],
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0,
          max_tokens: 2048,
        });

        // Only one function call is expected
        const {
          content: [block],
        } = response;
        expect(block.type).toBe("tool_use");
        const toolUseBlock = block as ToolUseBlock;
        expect(toolUseBlock.name).toBe("make_request");

        // Check that function calls are same
        expect(toolUseBlock.input).toMatchSnapshot();

        expect(matchesJsonSchema(toolUseBlock.input)).toBe(true);

        expect(validatePathParams(toolUseBlock.input)).toBe(true);

        if (validate) {
          expect(validate(toolUseBlock.input)).toBe(true);
        }
      },
    );
  }
});
