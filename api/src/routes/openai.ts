import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post(
  "/v0/generate-request",
  cors(),
  zValidator(
    "json",
    z.object({ handler: z.string(), method: z.string(), path: z.string() }),
  ),
  async (ctx) => {
    const { handler, method, path } = ctx.req.valid("json");

    const openaiClient = new OpenAI({
      apiKey: ctx.env.OPENAI_API_KEY,
    });

    const response = await openaiClient.chat.completions.create({
      // NOTE - This model should guarantee function calling to have json output
      model: "gpt-4o",
      // NOTE - We can restrict the response to be from this single tool call
      tool_choice: { type: "function", function: { name: "make_request" } },
      // Define the make_request tool
      tools: [
        {
          type: "function" as const,
          function: {
            name: "make_request",
            description:
              "Generates some random data for a request to the backend",
            // Describe parameters as json schema
            // https://json-schema.org/understanding-json-schema/
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                },
                routeParams: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "string",
                      },
                      value: {
                        type: "string",
                      },
                    },
                  },
                },
                queryParams: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "string",
                      },
                      value: {
                        type: "string",
                      },
                    },
                  },
                },
                // NOTE - If we want to support different body types, this could be helpful
                body: {
                  type: "string",
                },
                //
                // Best possible description of a json request body...
                // body: {
                //   "oneOf": [
                //     {
                //       "type": "object",
                //       "description": "JSON object body"
                //     },
                //     {
                //       "type": "array",
                //       "description": "JSON array body",
                //       items: {} // Explicitly define items
                //     },
                //     {
                //       "type": "string",
                //       "description": "String body"
                //     },
                //     {
                //       "type": "object",
                //       "description": "FormData body",
                //       "properties": {
                //         "fields": {
                //           "type": "object",
                //           "additionalProperties": {
                //             "oneOf": [
                //               {
                //                 "type": "string"
                //               },
                //               {
                //                 "type": "array",
                //                 "items": {
                //                   "type": "string"
                //                 }
                //               }
                //             ]
                //           }
                //         }
                //       },
                //       "required": ["fields"],
                //       "additionalProperties": false
                //     }
                //   ]
                // },
              },
              // TODO - Mark fields like `routeParams` as required based on the route definition?
              required: ["path"],
            },
          },
        },
      ],
      messages: [
        {
          role: "system",
          content: cleanPrompt(`
            You are a code debugging assistant for apps that use Hono (web framework), 
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You need to help craft a request to route handlers. 
            You will be provided the source code for handlers, and you should generate
            query parameters and a request body that will test the request.

            Be clever and creative with test data. Avoid just writing things like "test".

            For example, if you get a route like \`/users/:id\`, you should return a URL like:
            \`/users/1234567890\` and a routeParams parameter like this:

            { "routeParams": { "key": ":id", "value": "1234567890" } }

            If you get a route like this \`/users\`, you should return a URL like:

            Use the tool "make_request". Always respond in valid JSON.
          `),
        },
        {
          role: "user",
          content: cleanPrompt(`
            I need to make a request to one of my Hono api handlers.

            It should be a ${method} request to route: ${path}

            Here is the code for the handler:
            ${handler}
          `),
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const {
      // id: responseId,
      choices: [{ message }],
    } = response;

    console.log("message", message);
    const makeRequestCall = message.tool_calls?.[0];
    const toolArgs = makeRequestCall?.function?.arguments;
    console.log("toolArgs", toolArgs);
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;
    console.log("parsedArgs", parsedArgs);
    // const requestDescription = parsedArgs?.[0];

    return ctx.json({
      request: parsedArgs,
    });
  },
);

app.post(
  "/v0/analyze-error",
  cors(),
  zValidator(
    "json",
    z.object({ errorMessage: z.string(), handlerSourceCode: z.string() }),
  ),
  async (ctx) => {
    const { handlerSourceCode, errorMessage } = ctx.req.valid("json");

    const openaiClient = new OpenAI({
      apiKey: ctx.env.OPENAI_API_KEY,
    });

    const response = await openaiClient.chat.completions.create({
      // NOTE - This model (should?) guarantee function calling to have json output
      model: "gpt-4o",
      // NOTE - We can restrict the response to be from this single tool call
      // tool_choice: {
      // 	type: "function",
      // 	function: { name: "extract_useful_queries" },
      // },
      messages: [
        {
          role: "system",
          content: cleanPrompt(`
            You are a code debugging assistant for apps that use Hono (web framework), 
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You are given a function and an error message.
            Provide a succinct suggestion to fix the error, or say "I need more context to help fix this".
          `),
        },
        {
          role: "user",
          content: cleanPrompt(`
            I hit the following error: 
            ${errorMessage}
            This error originated in the following route handler for my Hono application:
            ${handlerSourceCode}
          `),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    const {
      // id: responseId,
      choices: [{ message }],
    } = response;

    return ctx.json({
      suggestion: message.content,
    });
  },
);

export default app;

function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
