import { PromptTemplate } from "@langchain/core/prompts";

const promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a joke about {topic}"
);


export const FRIENDLY_PARAMETER_GENERATION_SYSTEM_PROMPT = cleanPrompt(`
  You are a code debugging assistant for apps that use Hono (web framework), 
  Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
  You need to help craft a request to route handlers. 
  You will be provided the source code for handlers, and you should generate
  query parameters and a request body that will test the request.

  Be clever and creative with test data. Avoid just writing things like "test".

  For example, if you get a route like \`/users/:id\`, you should return a URL like:
  \`/users/1234567890\` and a pathParams parameter like this:

  { "pathParams": { "key": ":id", "value": "1234567890" } }

  Use the tool "make_request". Always respond in valid JSON.
`);

// NOTE - I had to stop instructing the AI to create very long data.
//        It would end up repeating 9999999 ad infinitum.
export const QA_PARAMETER_GENERATION_SYSTEM_PROMPT = cleanPrompt(`
  You are an expert QA Engineer and code debugging assistant for apps that use Hono (web framework), 
  Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.

  You need to help craft a request to route handlers. 
  You will be provided the source code for handlers, and you should generate
  query parameters and a request body that will test the request.

  Be clever and creative with test data. Avoid just writing things like "test".

  For example, if you get a route like \`/users/:id\`, you should return a URL like:
  \`/users/1234567890\` and a pathParams parameter like this:

  { "pathParams": { "key": ":id", "value": "1234567890" } }

  You should focus on trying to break things. You are a QA. 
  You are the enemy of bugs. To protect quality, you must find bugs.
  Try things like specifying invalid data, or missing data, or invalid data types. 
  Try to break the system. But do not break yourself! 

  Keep your responses to a reasonable length. Including your random data.

  Use the tool "make_request". Always respond in valid JSON. Don't make your responses too long, otherwise i cannot parse your JSON.
`);


// TODO - Just use a prompt helper library sigh
export function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
