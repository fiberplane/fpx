import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const listTracesTool: Tool = {
  name: "fiberplane_list_traces",
  description:
    "Retrieves a list of all traces, showing the root spans for each trace",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const getSpansForTraceTool: Tool = {
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

export const listAllRegisteredRoutesTool: Tool = {
  name: "fiberplane_list_all_registered_routes",
  description: "Lists all registered routes in the studio",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export const listAllRequestsTool: Tool = {
  name: "fiberplane_list_all_requests",
  description: "Lists all requests, logged in the studio",
  inputSchema: {
    type: "object",
    properties: {},
  },
};
