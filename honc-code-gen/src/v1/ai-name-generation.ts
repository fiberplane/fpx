const SYSTEM_PROMPT = `
You are a helpful assistant that generates names for software projects.

The user will ask you to generate a name for their project.
You should come up with a clever name for the project they describe

A few examples:

Q: a social network for people to share their thoughts and ideas
A: thought-stream

Be succint. Be clever.
Use hyphens instead of spaces.
Do not use special characters.
Act as if you are naming a folder on a filesystem.
Respond with a single name, no additional text.
`.trim();

const EXAMPLE_USER_PROMPT = createPrompt(
  `
a slackbot that barks like a dog when it is mentioned
`.trim(),
);

const EXAMPLE_ASSISTANT_RESPONSE = `
charles-barky
`.trim();

export async function generateName(AI: Ai, description: string) {
  const model = "@cf/meta/llama-3.1-8b-instruct-fast";
  const result = await AI.run(model as BaseAiTextGenerationModels, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: EXAMPLE_USER_PROMPT },
      { role: "assistant", content: EXAMPLE_ASSISTANT_RESPONSE },
      { role: "user", content: createPrompt(description) },
    ],
    temperature: 0.2,
  });

  let name: string;

  // Handle the case where the result is a ReadableStream because cloudflare types are wonky
  if (result instanceof ReadableStream) {
    name = await new Response(result).text();
  } else {
    name = result.response ?? "";
  }
  return cleanName(name);
}

// Clean up the name returned by the AI to be a valid folder name
function cleanName(name: string) {
  return (
    name
      // Split on camelCase (preserving acronyms)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Remove special characters and convert to spaces
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      // Trim whitespace, convert to lowercase
      .trim()
      .toLowerCase()
      // Replace one or more spaces/hyphens with single hyphen
      .replace(/[-\s]+/g, "-")
  );
}

function createPrompt(description: string) {
  return `
Help me come up with a name for this project:

${description}

This is important to my career.
`.trim();
}
