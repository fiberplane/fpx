import logger from "../../logger.js";

type GenerateRequestOptions = {
  apiKey: string;
  persona: string;
  method: string;
  path: string;
  handler: string;
  handlerContext?: string;
  history?: Array<string>;
  openApiSpec?: string;
  middleware?: {
    handler: string;
    method: string;
    path: string;
  }[];
  middlewareContext?: string;
};

export async function generateRequestWithFp({
  apiKey,
  persona,
  method,
  path,
  handler,
  handlerContext,
  history,
  openApiSpec,
  middleware,
  middlewareContext,
}: GenerateRequestOptions) {
  logger.debug(
    "Generating request data with FP",
    `persona: ${persona}`,
    `method: ${method}`,
    `path: ${path}`,
    // `handler: ${handler}`,
    // `handlerContext: ${handlerContext}`,
    // `openApiSpec: ${openApiSpec}`,
    // `middleware: ${middleware}`,
    // `middlewareContext: ${middlewareContext}`,
  );
  const response = await fetch("http://localhost:3578/ai/request", {
    method: "POST",
    body: JSON.stringify({
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
}
