#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_FIBERPLANE_STUDIO_URL = "http://localhost:8788";

// Tool definitions
const listTracesTool: Tool = {
  name: "fiberplane_list_traces",
  description:
    "Retrieves a list of all traces, showing the root spans for each trace",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getSpansForTraceTool: Tool = {
  name: "fiberplane_get_spans_for_trace",
  description: "Retrieves all spans for a specific trace ID",
  inputSchema: {
    type: "object",
    properties: {
      traceId: {
        type: "string",
        description: "The ID of the trace to fetch spans for",
      },
    },
    required: ["traceId"],
  },
};

const listAllRegisteredRoutesTool: Tool = {
  name: "fiberplane_list_all_registered_routes",
  description: "Lists all registered routes in the studio",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const listAllRequestsTool: Tool = {
  name: "fiberplane_list_all_requests",
  description: "Lists all requests, logged in the studio",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const getFileTreeTool: Tool = {
  name: "fiberplane_get_file_tree",
  description: "Gets the file tree for the current app",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

const sendRequestTool: Tool = {
  name: "fiberplane_send_request",
  description:
    "Send an HTTP request through Fiberplane Studio with tracing capabilities",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to send the request to",
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
        description: "HTTP method for the request",
      },
      headers: {
        type: "object",
        description: "Optional headers to include in the request",
        additionalProperties: {
          type: "string",
        },
      },
      route: {
        type: "string",
        description: "Optional Hono route pattern for the request",
      },
      pathParams: {
        type: "object",
        description: "Optional path parameters for the request",
        additionalProperties: {
          type: "string",
        },
      },
      body: {
        type: ["object", "string", "null"],
        description:
          "Optional request body. Can be a string for raw body or an object for JSON/form data",
      },
    },
    required: ["url", "method"],
  },
};

async function main() {
  console.error("Starting Fiberplane MCP Server ...");

  const server = new Server(
    { name: "Fiberplane MCP Server", version: "0.1.0" },
    {
      capabilities: {
        tools: {
          fiberplane_list_traces: listTracesTool,
          fiberplane_get_spans_for_trace: getSpansForTraceTool,
          fiberplane_list_all_registered_routes: listAllRegisteredRoutesTool,
          fiberplane_list_all_requests: listAllRequestsTool,
          fiberplane_send_request: sendRequestTool,
          fiberplane_get_file_tree: getFileTreeTool,
        },
      },
    },
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received tool call request:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const tool = request.params.name;
        const baseUrl =
          process.env.FIBERPLANE_STUDIO_URL || DEFAULT_FIBERPLANE_STUDIO_URL;

        switch (tool) {
          case "fiberplane_list_traces": {
            const response = await fetch(`${baseUrl}/v1/traces`);
            const traces = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(traces),
                },
              ],
            };
          }

          case "fiberplane_get_spans_for_trace": {
            const { traceId } = request.params.arguments;
            if (!traceId) {
              throw new Error("No traceId provided");
            }
            const response = await fetch(
              `${baseUrl}/v1/traces/${traceId}/spans`,
            );
            const spans = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(spans),
                },
              ],
            };
          }

          case "fiberplane_list_all_registered_routes": {
            const response = await fetch(`${baseUrl}/v0/app-routes`);
            const routes = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(routes),
                },
              ],
            };
          }

          case "fiberplane_list_all_requests": {
            const response = await fetch(`${baseUrl}/v0/all-requests`);
            const requests = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(requests),
                },
              ],
            };
          }

          case "fiberplane_get_file_tree": {
            const response = await fetch(`${baseUrl}/v0/app-routes-file-tree`);
            const fileTree = await response.json();
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(fileTree),
                },
              ],
            };
          }

          case "fiberplane_send_request": {
            const {
              url,
              method,
              headers = {},
              route,
              pathParams,
              body,
            } = request.params.arguments as {
              url: string;
              method: string;
              headers?: Record<string, string>;
              route?: string;
              pathParams?: Record<string, string>;
              body?: string | object | null;
            };

            const proxyHeaders: Record<string, string> = {
              "x-fpx-proxy-to": url,
              "x-fpx-headers-json": JSON.stringify(headers),
            };

            if (route) {
              proxyHeaders["x-fpx-route"] = route;
            }

            if (pathParams) {
              proxyHeaders["x-fpx-path-params"] = JSON.stringify(pathParams);
            }

            const requestInit: RequestInit = {
              method: method as string,
              headers: proxyHeaders,
            };

            // Handle body based on type
            if (body !== undefined && body !== null) {
              if (typeof body === "string") {
                requestInit.body = body;
              } else if (typeof body === "object") {
                requestInit.body = JSON.stringify(body);
                // Set content-type if not already set in headers
                if (!headers["content-type"]) {
                  proxyHeaders["x-fpx-headers-json"] = JSON.stringify({
                    ...headers,
                    "content-type": "application/json",
                  });
                }
              }
            }
            console.error("Request headers:", proxyHeaders);
            console.error("Request init:", requestInit);

            const response = await fetch(
              `${baseUrl}/v0/proxy-request/*`,
              requestInit,
            );
            const responseData = await response.json();

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(responseData),
                },
              ],
            };
          }

          default: {
            throw new Error(`Unknown tool: ${tool}`);
          }
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received list tools request");
    return {
      tools: [
        listTracesTool,
        getSpansForTraceTool,
        listAllRegisteredRoutesTool,
        listAllRequestsTool,
        sendRequestTool,
        getFileTreeTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport ...");
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Error starting MCP server", error);
  process.exit(1);
});
