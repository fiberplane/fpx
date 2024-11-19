export type OpenApiPathItem = {
  [method: string]: OpenAPIOperation;
};

export type OpenApiSpec = {
  paths: {
    [path: string]: OpenApiPathItem;
  };
  // components?: any;
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
