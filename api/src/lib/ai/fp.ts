import logger from "../../logger.js";
import { makeFpAuthRequest } from "../fp-services/request.js";

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

  const response = await makeFpAuthRequest({
    token: apiKey,
    method: "POST",
    path: "/ai/request",
    body: {
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
    },
  });

  return response.json();
}
