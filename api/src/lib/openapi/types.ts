export type OpenApiPathItem = {
  [method: string]: OpenAPIOperation;
};

export type OpenApiSpec = {
  paths: {
    [path: string]: OpenApiPathItem;
  };
  components?: OpenAPIComponents;
};

// Define types for OpenAPI operation objects
type OpenAPIParameter = {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  schema?: {
    type: string;
    format?: string;
  };
  description?: string;
};

type OpenAPIResponse = {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: {
        type: string;
        properties?: Record<string, unknown>;
      };
    };
  };
};

export type OpenAPIOperation = {
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content: {
      [mediaType: string]: {
        schema: Record<string, unknown>;
      };
    };
  };
  responses: {
    [statusCode: string]: OpenAPIResponse;
  };
  tags?: string[];
};

export type OpenAPIComponents = {
  schemas?: Record<string, OpenAPISchema>;
  parameters?: Record<string, OpenAPIParameter>;
  responses?: Record<string, OpenAPIResponse>;
  requestBodies?: Record<string, OpenAPIRequestBody>;
};

export type OpenAPISchema = {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  $ref?: string;
  // Add other schema properties as needed
};

export type OpenAPIRequestBody = {
  content: {
    [mediaType: string]: {
      schema: Record<string, unknown>;
    };
  };
};

export type RefCache = Map<string, unknown>;
