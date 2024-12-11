import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getSpansForTraceTool,
  listAllRegisteredRoutesTool,
  listAllRequestsTool,
  listTracesTool,
} from "./tools.js";

async function main() {
  console.log("Starting Fiberplane MCP Server ...");

  const server = new Server(
    { name: "Fiberplane MCP Server", version: "0.1.0" },
    {
      capabilities: {
        tools: {
          fiberplane_list_traces: listTracesTool,
          fiberplane_get_spans_for_trace: getSpansForTraceTool,
          fiberplane_list_all_registered_routes: listAllRegisteredRoutesTool,
          fiberplane_list_all_requests: listAllRequestsTool,
        },
      },
    },
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.log("Received tool call request:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const tool = request.params.name;
        const baseUrl = process.env.FIBERPLANE_STUDIO_URL || "http://localhost:8788";

        switch (tool) {
          case "fiberplane_list_traces": {
            const response = await fetch(`${baseUrl}/v1/traces`);
            const traces = await response.json();
            console.log("traces", traces);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(traces)
              }]
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
            console.log("spans", spans);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(spans)
              }]
            };
          }

          case "fiberplane_list_all_registered_routes": {
            const response = await fetch(`${baseUrl}/v0/app-routes`);
            const routes = await response.json();
            console.log("routes", routes);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(routes)
              }]
            };
          }

          case "fiberplane_list_all_requests": {
            const response = await fetch(`${baseUrl}/v0/all-requests`);
            const requests = await response.json();
            console.log("requests", requests);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(requests)
              }]
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
    console.log("Received list tools request");
    return {
      tools: [
        listTracesTool,
        getSpansForTraceTool,
        listAllRegisteredRoutesTool,
        listAllRequestsTool,
      ],
    };
  });

  const transport = new StdioServerTransport();
  console.log("Connecting server to transport ...");
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Error starting MCP server", error);
  process.exit(1);
});
