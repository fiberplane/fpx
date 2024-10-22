export const makeRequestTool = {
  type: "function",
  function: {
    name: "make_request",
    description:
      "Generates some random data for an http request to an api backend",
    // Describe parameters as json schema https://json-schema.org/understanding-json-schema/
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        pathParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        queryParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        body: {
          type: "string",
        },
        bodyType: {
          type: "object" as const,
          properties: {
            type: {
              type: "string" as const,
              enum: ["json", "text", "form-data", "file"],
            },
            isMultipart: {
              type: "boolean" as const,
            },
          },
        },
        headers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
      },
      // TODO - Mark fields like `pathParams` as required based on the route definition?
      required: ["path"],
    },
  },
} as const;
