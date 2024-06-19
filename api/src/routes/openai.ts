import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";
import type { Bindings, Variables } from "../lib/types.js";

const PARAMETER_GENERATION_SYSTEM_PROMPT = cleanPrompt(`
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
`);

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post(
  "/v0/generate-request",
  cors(),
  // zValidator(
  //   "json",
  //   z.object({ handler: z.string(), method: z.string(), path: z.string(), history: z.array(z.string()).optional() }),
  // ),
  async (ctx) => {
    // const { handler, method, path, history } = ctx.req.valid("json");
    const { handler, method, path, history } = await ctx.req.json();

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
            // Describe parameters as json schema https://json-schema.org/understanding-json-schema/
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
                body: {
                  type: "string",
                },
                // NOTE - If we want to support different body types, this could be helpful
                //
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
          content: PARAMETER_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: cleanPrompt(`
            I need to make a request to one of my Hono api handlers.

            Here are some recent requests/responses, which you can use as inspiration for future requests.
            E.g., if we recently created a resource, you can look that resource up.
            <history>
            ${history?.join("\n") ?? "NO HISTORY"}
            </history>

            The request you make should be a ${method} request to route: ${path}

            Here is the code for the handler:
            ${handler}
          `),
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const {
      choices: [{ message }],
    } = response;

    const makeRequestCall = message.tool_calls?.[0];
    const toolArgs = makeRequestCall?.function?.arguments;
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;

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

/**
 * Used in AI Builders Demo
 *
 * Takes in an fpx trace and tries to make sense of the error messages along the way
 */
app.post("/v0/summarize-trace-error", cors(), async (ctx) => {
  const { handlerSourceCode, trace } = await ctx.req.json();

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
            Provide a succinct summary/overview of the error.

            If you have a suggestion for a fix, give that too. But always be concise!!!

            We are rendering your response in a compact UI.

            If you don't see any errors, just summarize what happened as briefly as possible.
          `),
      },
      {
        role: "user",
        content: cleanPrompt(`
            I tried to invoke the following handler in my hono app while making a request:
            ${handlerSourceCode}

            These were the request parameters I used:
            // TODO - ignore for now

            And this is a summary of event data (logs, network requests) that happened:
            ${trace.join("\n")}
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
});

export default app;

function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
