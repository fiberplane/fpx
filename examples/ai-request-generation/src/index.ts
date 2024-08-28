import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { getSystemPrompt } from "./prompts";
import { makeRequestToolHermes } from "./tools";

type Bindings = {
  DATABASE_URL: string;
  // Cloudflare Workers AI binding
  // enabled in wrangler.toml with:
  //
  // > [ai]
  // > binding = "AI"
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/", async (c) => {
  const temperature = parseTemperature(c.req.query("temperature"), 0.12);
  const body = await c.req.json();
  const inferenceResult = await runInference(
    c.env.AI,
    body.prompt,
    temperature,
  );

  // We are not using streaming outputs, but just in case, handle the stream here
  if (inferenceResult instanceof ReadableStream) {
    return c.json(
      {
        message: "Unexpected inference result (stream)",
      },
      500,
    );
  }

  // We are theoretically enforcing a tool call, so this should not happen
  if (inferenceResult.response != null) {
    return c.json(
      {
        message: "Unexpected inference result (text)",
      },
      500,
    );
  }

  // Parse the tool call
  const makeRequestCall = inferenceResult.tool_calls?.[0];
  const requestDescriptor = makeRequestCall?.arguments;

  // TODO - Validate the request descriptor against the JSON Schema from the tool definition
  if (!isObjectGuard(requestDescriptor)) {
    return c.json(
      {
        message: "Invalid request descriptor",
      },
      500,
    );
  }

  console.log("requestDescriptor", JSON.stringify(requestDescriptor, null, 2));

  return c.json(requestDescriptor);
});

export default instrument(app, {
  monitor: {
    fetch: true,
    logging: true,
    cfBindings: true,
  },
});

export async function runInference(
  client: Ai,
  userPrompt: string,
  temperature: number,
) {
  const result = await client.run(
    // @ts-ignore - This model exists in the Worker types as far as I can tell
    //              I don't know why it's causing a typescript error here :(
    "@hf/nousresearch/hermes-2-pro-mistral-7b",
    {
      tools: [makeRequestToolHermes],
      // Restrict to only using this "make request" tool
      tool_choice: {
        type: "function",
        function: { name: makeRequestToolHermes.name },
      },

      messages: [
        {
          role: "system",
          content: getSystemPrompt("QA"),
        },
        // TODO - File issue on the Cloudflare docs repo
        //        Since this example did not work!
        //
        // {
        //   role: "user",
        //   content: userPrompt,
        // },
      ],
      temperature,

      // NOTE - The request will fail if you don't put the prompt here
      prompt: userPrompt,
    },
  );

  // HACK - Need to coerce this to a AiTextGenerationOutput
  return result as AiTextGenerationOutput;
}

function parseTemperature(
  strTemperature: string | undefined,
  fallback: number,
): number {
  if (!strTemperature) {
    return fallback;
  }

  const temperature = Number.parseFloat(strTemperature);
  if (Number.isNaN(temperature)) {
    return fallback;
  }

  return temperature;
}

const isObjectGuard = (value: unknown): value is object =>
  typeof value === "object" && value !== null;
