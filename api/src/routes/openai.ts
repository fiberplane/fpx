import type { Bindings, Variables } from "../lib/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post(
  "/v0/analyze-error",
  cors(),
  zValidator(
    "json",
    z.object({ errorMessage: z.string(), handlerSourceCode: z.string() }),
  ),
  async (c) => {
    const { handlerSourceCode, errorMessage } = c.req.valid("json");

    const openaiClient = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
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
          content: `
            You are a code debugging assistant for apps that use Hono (web framework), 
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You are given a function and an error message.
            Provide a succinct suggestion to fix the error, or say "I need more context to help fix this".
          `.trim(),
        },
        {
          role: "user",
          content: `
            I hit the following error: 
            ${errorMessage}
            This error originated in the following route handler for my Hono application:
            ${handlerSourceCode}
          `
            .trim()
            .split("\n")
            .map((l) => l.trim())
            .join("\n"),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    const {
      // id: responseId,
      choices: [{ message }],
    } = response;

    return c.json({
      suggestion: message.content,
    });
  },
);

export default app;
