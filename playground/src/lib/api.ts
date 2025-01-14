import type { Workflow } from "@/types";

// Mock data
const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "User Authentication Flow",
    status: "completed",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "1",
        name: "Validate Input",
        status: "completed",
        operationPath: "/auth/validate",
      },
      {
        id: "2",
        name: "Check Credentials",
        status: "completed",
        operationPath: "/auth/check",
      },
      {
        id: "3",
        name: "Generate Token",
        status: "completed",
        operationPath: "/auth/token",
      },
    ],
  },
  {
    id: "2",
    name: "Data Processing Pipeline",
    status: "pending",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "1",
        name: "Extract Data",
        status: "completed",
        operationPath: "/data/extract",
      },
      {
        id: "2",
        name: "Transform Data",
        status: "pending",
        operationPath: "/data/transform",
      },
      {
        id: "3",
        name: "Load Data",
        status: "pending",
        operationPath: "/data/load",
      },
    ],
  },
  {
    id: "3",
    name: "Error Handling Flow",
    status: "failed",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "1",
        name: "Try Operation",
        status: "failed",
        operationPath: "/error/try",
      },
      {
        id: "2",
        name: "Catch Error",
        status: "pending",
        operationPath: "/error/catch",
      },
      {
        id: "3",
        name: "Log Error",
        status: "pending",
        operationPath: "/error/log",
      },
    ],
  },
];

export const api = {
  getWorkflows: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockWorkflows;
  },

  getWorkflow: async (id: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const workflow = mockWorkflows.find((w) => w.id === id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    return workflow;
  },

  createWorkflow: async (userStory: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newWorkflow: Workflow = {
      id: String(mockWorkflows.length + 1),
      name: userStory,
      status: "pending",
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: "1",
          name: "Analyze Requirements",
          status: "pending",
          operationPath: "/analyze",
        },
        {
          id: "2",
          name: "Generate Steps",
          status: "pending",
          operationPath: "/generate",
        },
        {
          id: "3",
          name: "Validate Steps",
          status: "pending",
          operationPath: "/validate",
        },
      ],
    };

    mockWorkflows.push(newWorkflow);
    return newWorkflow;
  },
};
