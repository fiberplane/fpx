import type { ApiResponse, Workflow } from "@/types";
import {
  OtelSpanSchema,
  type TraceDetailSpansResponse,
  TraceListResponseSchema,
  TraceSummarySchema,
} from "@fiberplane/fpx-types";
import z from "node_modules/zod/lib";

function getBasePrefix(): string {
  // if we're running on localhost directly - skip this
  if (import.meta.env.DEV) {
    return "";
  }

  const rootElement = document.getElementById("root");
  if (!rootElement?.dataset.options) {
    return "";
  }

  const { mountedPath } = JSON.parse(rootElement.dataset.options) as {
    mountedPath: string;
  };

  return mountedPath;
}

export const api = {
  getWorkflows: async () => {
    const basePrefix = getBasePrefix();
    const response = await fetch(`${basePrefix}/api/workflow`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  getWorkflow: async (id: string): Promise<ApiResponse<Workflow>> => {
    const basePrefix = getBasePrefix();
    const response = await fetch(`${basePrefix}/api/workflow/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  createWorkflow: async (data: {
    prompt: string;
    openApiSchema: string;
    summary?: string;
    description?: string;
  }): Promise<ApiResponse<Workflow>> => {
    const basePrefix = getBasePrefix();
    const response = await fetch(`${basePrefix}/api/workflow/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  updateWorkflow: async (
    id: string,
    data: {
      prompt: string;
      openApiSchemaId: string;
      summary?: string;
      description?: string;
    },
  ): Promise<ApiResponse<Workflow>> => {
    const basePrefix = getBasePrefix();
    const response = await fetch(`${basePrefix}/api/workflow/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    const basePrefix = getBasePrefix();
    const response = await fetch(`${basePrefix}/api/workflow/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
  },

  getTraces: async () => {
    const response = await fetch(`${getTraceBaseUrl()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const data = await response.json();
    return {
      data: TraceListResponseSchema.parse(data),
    };
  },

  getTrace: async (
    id: string,
  ): Promise<ApiResponse<TraceDetailSpansResponse>> => {
    const response = await fetch(`${getTraceBaseUrl()}/${id}/spans`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const data = await response.json();
    const aaagagagag = TraceSummarySchema.parse({
      traceId: id,
      spans: data,
    });
    return {
      data: aaagagagag.spans,
    };
  },
};

function getTraceBaseUrl() {
  return "http://localhost:8788/v1/traces";
}
