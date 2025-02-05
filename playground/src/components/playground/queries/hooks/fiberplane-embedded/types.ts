import type { OpenAPIComponents } from "@fiberplane/fpx-types";
import type { ApiRoute } from "../../../types";

export type ApiRoutesResponse = {
  baseUrl: string;
  routes: ApiRoute[];
};

export type OpenAPIOperation = {
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: {
      type: string;
      format?: string;
    };
  }>;
  responses: Record<string, unknown>;
};

export type OpenAPIPathItem = {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  head?: OpenAPIOperation;
};

export type OpenAPISpec = {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers?: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, OpenAPIPathItem>;
  components: OpenAPIComponents;
};

export const VALID_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
  "HEAD",
] as const;
export type ValidMethod = (typeof VALID_METHODS)[number];

export function isValidMethod(method: string): method is ValidMethod {
  return VALID_METHODS.includes(method.toUpperCase() as ValidMethod);
}

export type ResolvedSpecResult =
  | {
      type: "success";
      spec: OpenAPISpec;
    }
  | {
      type: "error";
      error: string;
      source: string;
      retryable: boolean;
      attemptedUrl?: string;
    }
  | {
      type: "empty";
    };
