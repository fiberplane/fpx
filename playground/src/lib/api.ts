import type { Workflow } from "@/types";

// Mock data
const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "User Authentication Flow",
    prompt: "Create a user authentication workflow",
    oaiSchemaId: "auth-schema",
    summary: "Handles user authentication process",
    description: "A workflow that manages the user authentication process including validation and token generation",
    lastRunStatus: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        stepId: "1",
        description: "Validate user input",
        operationPath: "/auth/validate",
      },
      {
        stepId: "2", 
        description: "Check user credentials",
        operationPath: "/auth/check",
      },
      {
        stepId: "3",
        description: "Generate auth token",
        operationPath: "/auth/token",
      },
    ],
  },
  {
    id: "2",
    name: "Data Processing Pipeline",
    prompt: "Create a data processing pipeline",
    oaiSchemaId: "data-schema",
    summary: "Processes data through ETL pipeline",
    lastRunStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        stepId: "1",
        description: "Extract data from source",
        operationPath: "/data/extract",
      },
      {
        stepId: "2",
        description: "Transform data",
        operationPath: "/data/transform",
      },
      {
        stepId: "3",
        description: "Load data to target",
        operationPath: "/data/load",
      },
    ],
  },
];

const API_BASE_URL = "http://localhost:3000";

export const api = {
  getWorkflows: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const response = {
      success: true as const,
      data: mockWorkflows,
    };
    return response;
  },

  getWorkflow: async (id: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const workflow = mockWorkflows.find((w) => w.id === id);
    if (!workflow) {
      const errorResponse = {
        success: false as const,
        error: { message: "Workflow not found" },
      };
      throw new Error(JSON.stringify(errorResponse));
    }
    return {
      success: true as const,
      data: workflow,
    };
  },

  createWorkflow: async (data: {
    name: string;
    prompt: string;
    oaiSchemaId: string;
    summary?: string;
    description?: string;
  }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newWorkflow: Workflow = {
      id: String(mockWorkflows.length + 1),
      ...data,
      lastRunStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [], // Steps will be populated by the backend
    };

    mockWorkflows.push(newWorkflow);
    return {
      success: true as const,
      data: newWorkflow,
    };
  },

  getSchemas: async () => {
    const response = await fetch(`${API_BASE_URL}/oai_schema`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  },

  getSchema: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/oai_schema/${id}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  },
};
