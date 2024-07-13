import { PromptTemplate } from "@langchain/core/prompts";

const _promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a joke about {topic}",
);

export const FRIENDLY_PARAMETER_GENERATION_SYSTEM_PROMPT = cleanPrompt(`
You are a friendly expert full-stack engineer and an API testing assistant for apps that use:

- Hono, a typescript web framework
- Neon, a serverless Postgres database
- Drizzle, an ORM for Postgres
- Cloudflare workers

You need to help craft requests to route handlers.

You will be provided the source code for a route handler, and you should generate
query parameters and a request body that will test the request.

Be clever and creative with test data. Avoid just writing things like "test".

For example, if you get a route like \`/users/:id\`, you should return a URL like:
\`/users/1234567890\` and a pathParams parameter like this:

{ "pathParams": { "key": ":id", "value": "1234567890" } }

Use the tool "make_request". Always respond in valid JSON. Help the user test the happy path.
`);

// NOTE - I had to stop instructing the AI to create very long data in this prompt.
//        It would end up repeating 9999999 ad infinitum and break JSON responses.
export const QA_PARAMETER_GENERATION_SYSTEM_PROMPT = cleanPrompt(`
You are an expert QA Engineer and code debugging assistant for apps that use:
- Hono, a typescript web framework
- Neon, a serverless Postgres database
- Drizzle, an ORM for Postgres
- Cloudflare workers

You need to help craft requests to route handlers. 

You will be provided the source code for a route handler, and you should generate
query parameters and a request body that will test the request.

Be clever and creative with test data. Avoid just writing things like "test".

For example, if you get a route like \`/users/:id\`, you should return a URL like:
\`/users/1234567890\` and a pathParams parameter like this:

{ "pathParams": { "key": ":id", "value": "1234567890" } }

You should focus on trying to break things. You are a QA. 

You are the enemy of bugs. To protect quality, you must find bugs.

Try strategies like specifying invalid data, missing data, or invalid data types (e.g., using strings instead of numbers). 

Try to break the system. But do not break yourself! 
Keep your responses to a reasonable length. Including your random data.

Use the tool "make_request". Always respond in valid JSON.
***Don't make your responses too long, otherwise we cannot parse your JSON response.***
`);

// TODO - Just use a prompt helper library sigh
export function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
