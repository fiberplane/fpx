import type { ApiResponse, Workflow } from "@/types";
import {
  type TraceDetailSpansResponse,
  TraceListResponseSchema,
  TraceSummarySchema,
} from "@fiberplane/fpx-types";
import {
  FetchOpenApiSpecError,
  isFailedToFetchError,
  parseErrorResponse,
} from "./errors";
import { safeParseBodyText } from "./utils";
import { fpFetch } from "./fetch";

export const api = {
  getWorkflows: async (): Promise<ApiResponse<Workflow[]>> => {
    const response = await fpFetch<ApiResponse<Workflow[]>>("/api/workflows");
    return response;
  },

  getWorkflow: async (id: string): Promise<ApiResponse<Workflow>> => {
    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/workflows/${id}`);
    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }
    return response.json();
  },

  createWorkflow: async (data: {
    prompt: string;
    openApiSchema: string;
    summary?: string;
    description?: string;
  }): Promise<ApiResponse<Workflow>> => {
    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/workflows/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
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
    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/workflows/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }

    return response.json();
  },

  deleteWorkflow: async (id: string): Promise<void> => {
    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/workflows/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }
  },

  getTraces: async (fpxEndpointHost: string) => {
    const basePrefix = getFpApiBasePath();
    const tracesUrl = fpxEndpointHost
      ? `${fpxEndpointHost}/v1/traces`
      : `${basePrefix}/api/traces`;
    const response = await fetch(tracesUrl);
    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }
    const data = await response.json();
    return {
      data: TraceListResponseSchema.parse(data),
    };
  },

  getTrace: async (
    fpxEndpointHost: string,
    id: string,
  ): Promise<ApiResponse<TraceDetailSpansResponse>> => {
    const basePrefix = getFpApiBasePath();
    const tracesUrl = fpxEndpointHost
      ? `${fpxEndpointHost}/v1/traces/${id}/spans`
      : `${basePrefix}/api/traces/${id}/spans`;

    const response = await fetch(tracesUrl);
    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }
    const data = await response.json();
    const parsedTrace = TraceSummarySchema.parse({
      traceId: id,
      spans: data,
    });
    return {
      data: parsedTrace.spans,
    };
  },

  getOpenApiSpec: async (path: string): Promise<string> => {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        const bodyText = await safeParseBodyText(response);
        throw new FetchOpenApiSpecError(
          `Error ${response.status} fetching OpenAPI spec at ${path}`,
          path,
          response.status,
          bodyText,
        );
      }

      return response.text();
    } catch (error) {
      if (isFailedToFetchError(error)) {
        throw new FetchOpenApiSpecError(
          `OpenAPI Spec unreachable at ${path}`,
          path,
        );
      }

      throw new FetchOpenApiSpecError(
        `Unknown error fetching OpenAPI spec at ${path}`,
        path,
      );
    }
  },

  post: async <T>(path: string, data: unknown): Promise<T> => {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }

    return response.json();
  },

  createReport: async (data: {
    traceId: string;
    description: string;
  }): Promise<ApiResponse<void>> => {
    // NOTE - For testing the flow in the UI
    // TODO - Remove this once ui is more finalized
    // window.alert("hello");
    // return { data: {} };

    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/reports/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }

    return response.json();
  },

  getTraceSummary: async (data: {
    traceId: string;
    spans: TraceDetailSpansResponse;
  }): Promise<ApiResponse<{ summary: string }>> => {
    // HACK - To avoid excessive requests to the API
    // await new Promise((resolve) => setTimeout(resolve, 1500));
    // return {
    //   data: {
    //     summary:
    //       "The trace shows a successful GET request to `/fp/api/workflow` on `localhost:8787`, which then makes a client call to `https://playground-services.mies.workers.dev/api/workflow`. Both requests returned a `200 OK` status. The total duration of the server request was ~1.15s, with the client call taking ~1.15s. The response body contains workflow data. No obvious performance bottlenecks or errors are apparent.",
    //   },
    // };
    // // biome-ignore lint/correctness/noUnreachable: FOR TESTING PURPOSES
    const basePrefix = getFpApiBasePath();
    const response = await fetch(`${basePrefix}/api/assistant/trace-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }

    return response.json();
  },
};

function getFpApiBasePath(): string {
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
