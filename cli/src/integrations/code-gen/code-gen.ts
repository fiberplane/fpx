import type { Context } from "../../context";

// Define the expected structure of the scaffolded files
export type ScaffoldedFiles = {
  indexFile: string | null;
  schemaFile: string | null;
  seedFile: string | null;
};

// Define the expected structure of the API response
type CodeGenResponse = {
  result: ScaffoldedFiles;
};

export async function getScaffoldedFiles(ctx: Context) {
  const { sessionId, codeGenBaseUrl, codeGenApiKey } = ctx;

  const baseUrl = codeGenBaseUrl || "http://localhost:4468";

  const prompt = ctx.description;

  // If the user didn't provide a description, we can't do anything to scaffold
  if (shouldSkipCodeGen(ctx)) {
    return null;
  }

  const payload = {
    prompt: prompt,
    indexFile: ctx.indexFile,
    schemaFile: ctx.schemaFile,
    seedFile: ctx.seedFile,
  };

  const response = await fetch(`${baseUrl}/v0/build/${sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${codeGenApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const rawData = await response.json();

  if (isCodeGenResponse(rawData)) {
    return rawData.result;
  }

  throw new Error("Invalid response structure from code generation api");
}

export function shouldSkipCodeGen(ctx: Context) {
  return !ctx.description;
}

// Type guard to validate the response structure
function isCodeGenResponse(data: unknown): data is CodeGenResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "result" in data &&
    typeof data.result === "object" &&
    data.result !== null &&
    "indexFile" in data.result &&
    typeof data.result.indexFile === "string" &&
    "schemaFile" in data.result &&
    typeof data.result.schemaFile === "string" &&
    "seedFile" in data.result &&
    typeof data.result.seedFile === "string"
  );
}
