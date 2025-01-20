import type { Workflow, ApiResponse } from "@/types";

export const api = {
  getWorkflows: async () => {
    const response = await fetch("/api/workflow");
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data as ApiResponse<Workflow[]>;
  },

  getWorkflow: async (id: string) => {
    const response = await fetch(`/api/workflow/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data as ApiResponse<Workflow>;
  },

  createWorkflow: async (data: {
    prompt: string;
    oaiSchemaId: string;
    summary?: string;
    description?: string;
  }) => {
    const response = await fetch("/api/workflow/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }
    
    return responseData as ApiResponse<Workflow>;
  },

  updateWorkflow: async (id: string, data: {
    name: string;
    prompt: string;
    oaiSchemaId: string;
    summary?: string;
    description?: string;
  }) => {
    const response = await fetch(`/api/workflow/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(responseData));
    }
    
    return responseData as ApiResponse<Workflow>;
  },

  deleteWorkflow: async (id: string) => {
    const response = await fetch(`/api/workflow/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(JSON.stringify(data));
    }
  },

  getSchemas: async () => {
    const response = await fetch("/api/oai_schema");
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  },

  getSchema: async (id: string) => {
    const response = await fetch(`/api/oai_schema/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  },
};
