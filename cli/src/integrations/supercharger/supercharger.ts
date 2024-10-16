import type { Context } from "../../context";

// Define the expected structure of the scaffolded files
export type ScaffoldedFiles = {
  indexFile: string | null;
  schemaFile: string | null;
  seedFile: string | null;
};

// Define the expected structure of the API response
type SuperchargerResponse = {
  result: ScaffoldedFiles;
};

export async function getScaffoldedFiles(ctx: Context) {
  const { sessionId, superchargerBaseUrl, superchargerApiKey } = ctx;

  const baseUrl = superchargerBaseUrl || "http://localhost:4468";

  const prompt = ctx.description;

  // If the user didn't provide a description, we can't do anything to scaffold
  if (shouldSkipSupercharger(ctx)) {
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
      Authorization: `Bearer ${superchargerApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const rawData = await response.json();

  if (isValidSuperchargerResponse(rawData)) {
    return rawData.result;
  }

  throw new Error("Invalid response structure from supercharger");
}

export function shouldSkipSupercharger(ctx: Context) {
  return !ctx.description;
}

// Type guard to validate the response structure
function isValidSuperchargerResponse(
  data: unknown,
): data is SuperchargerResponse {
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
