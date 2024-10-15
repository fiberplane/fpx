import type { Context } from "../../context";

export async function getScaffoldedFiles(ctx: Context) {
  const { sessionId, superchargerBaseUrl, superchargerApiKey } = ctx;

  const baseUrl = superchargerBaseUrl || "http://localhost:4468";

  const payload = {
    prompt: ctx.description,
    indexFile: ctx.indexFile,
    schemaFile: ctx.schemaFile,
    seedFile: ctx.seedFile,
  };

  try {
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

    return await response.json();
  } catch (error) {
    console.error("Error calling supercharger:", error);
    throw error;
  }
}
