import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";
import { generateRequestWithOpenAI } from "../lib/ai/openai.js";
import { cleanPrompt } from "../lib/ai/prompts.js";
import type { Bindings, Variables } from "../lib/types.js";
import { getOpenAiConfig } from "./settings.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/v0/generate-request", cors(), async (ctx) => {
  const { handler, method, path, history, persona } = await ctx.req.json();

  const db = ctx.get("db");
  const openaiConfig = await getOpenAiConfig(db);

  if (!openaiConfig) {
    return ctx.json(
      {
        message: "No OpenAI configuration found",
      },
      403,
    );
  }
  if (!openaiConfig.openaiApiKey) {
    return ctx.json(
      {
        message: "OpenAI API key required",
      },
      403,
    );
  }
  if (!openaiConfig.openaiModel) {
    return ctx.json(
      {
        message: "OpenAI model not specified",
      },
      422,
    );
  }
  const { openaiApiKey, openaiModel } = openaiConfig;
  const parsedArgs = await generateRequestWithOpenAI({
    apiKey: openaiApiKey,
    model: openaiModel,
    persona,
    method,
    path,
    handler,
    history,
  }).catch((error) => {
    if (error instanceof Error) {
      return ctx.json({ message: error.message }, 500);
    }

    return ctx.json({ message: "Unknown error" }, 500);
  });

  return ctx.json({
    request: parsedArgs,
  });
});

app.post(
  "/v0/analyze-error",
  cors(),
  zValidator(
    "json",
    z.object({ errorMessage: z.string(), handlerSourceCode: z.string() }),
  ),
  async (ctx) => {
    const { handlerSourceCode, errorMessage } = ctx.req.valid("json");

    const db = ctx.get("db");
    const openaiConfig = await getOpenAiConfig(db);
    if (!openaiConfig) {
      return ctx.json(
        {
          error: "No OpenAI configuration found",
        },
        403,
      );
    }
    const { openaiApiKey, openaiModel } = openaiConfig;
    const openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
    const response = await openaiClient.chat.completions.create({
      model: openaiModel,
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
      choices: [{ message }],
    } = response;

    return ctx.json({
      suggestion: message.content,
    });
  },
);

/**
 * NOT YET IN USE IN THE UI. Originally developed for the AI builders demo.
 *
 * Takes in an fpx trace and tries to make sense of what happened when a route was invoked.
 */
app.post("/v0/summarize-trace-error/:traceId", cors(), async (ctx) => {
  const { handlerSourceCode, trace } = await ctx.req.json();
  const traceId = ctx.req.param("traceId");
  const db = ctx.get("db");
  const openaiConfig = await getOpenAiConfig(db);
  if (!openaiConfig) {
    return ctx.json(
      {
        error: "No OpenAI configuration found",
      },
      403,
    );
  }
  const { openaiApiKey, openaiModel } = openaiConfig;
  const openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  });

  const response = await openaiClient.chat.completions.create({
    model: openaiModel,
    messages: [
      {
        role: "system",
        content: cleanPrompt(`
            You are a code debugging assistant for apps that use Hono (web framework), 
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.

            You are given a route handler and some trace events that happened when the handler was executed.

            Provide a succinct summary/overview of what happened, especially if there was an error.

            If you have a suggestion for a fix, give that too. But always be concise!!!

            We are rendering your response in a compact UI.

            If you don't see any errors, just summarize what happened as briefly as possible.

            Format your response as markdown. Do not include a "summary" heading specifically, because that's already in our UI.
          `),
      },
      {
        role: "user",
        content: cleanPrompt(`
            I tried to invoke the following handler in my hono app while making a request:
            ${handlerSourceCode}

            And this is a summary of event data (logs, network requests) that happened inside my app:
            ${trace.join("\n")}
          `),
      },
    ],
    temperature: 0,
    max_tokens: 4096,
  });

  const {
    choices: [{ message }],
  } = response;

  return ctx.json({
    summary: message.content,
    traceId,
  });
});

export default app;
