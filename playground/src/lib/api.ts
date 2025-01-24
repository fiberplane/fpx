import type { ApiResponse, Workflow } from "@/types";

export const api = {
  getWorkflows: async (): Promise<ApiResponse<Workflow[]>> => {
    const response = await fetch("/api/workflow");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    return response.json();
  },

  getWorkflow: async (id: string): Promise<ApiResponse<Workflow>> => {
    const response = await fetch(`/api/workflow/${id}`);
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
    const response = await fetch("/api/workflow/create", {
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
    const response = await fetch(`/api/workflow/${id}`, {
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
    const response = await fetch(`/api/workflow/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
  },
};
