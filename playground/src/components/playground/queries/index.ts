import type { JsonSchemaType } from "@fiberplane/fpx-types";

// TODO - Use validation schema
export type ProxiedRequestResponse = {
  app_requests: {
    id: number;
    requestUrl: string;
    requestMethod: string;
    requestRoute: string;
    requestHeaders?: Record<string, string> | null;
    requestQueryParams?: Record<string, string> | null;
    requestPathParams?: Record<string, string> | null;
    requestBody?: JsonSchemaType;
    updatedAt: string;
  };
  // NOTE - can be undefined if request failed, at least that happened to me locally
  app_responses: {
    id: number;
    responseStatusCode: string;
    responseBody: string;
    responseHeaders: Record<string, string>;
    traceId: string;
    isFailure: boolean;
    failureReason: string | null;
    updatedAt: string;
  };
};

export * from "./hooks";
