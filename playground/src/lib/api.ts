import type { ApiResponse, Workflow } from "@/types";

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
};
