import { describe, it, expect } from "vitest";
import type { Step, Workflow } from "../../schemas/workflows.js";
import {
  resolveReference,
  resolveStepParams,
  resolveOutputs,
  resolveStepOutputs,
} from "./resolvers.js";

// Test fixtures
const mockWorkflowContext = {
  inputs: {
    name: "Test App",
    description: "A test application",
    expiresAt: 1728374400000,
  },
  steps: {
    createApp: {
      outputs: {
        appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
      },
      response: {
        statusCode: 201,
        body: {
          data: {
            id: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
            name: "Test App",
            description: "A test application",
          },
        },
      },
    },
    createTokenForApp: {
      outputs: {
        token: "fp_test_token_123",
      },
      response: {
        statusCode: 201,
        body: {
          data: {
            token: "fp_test_token_123",
            expiresAt: 1728374400000,
          },
        },
      },
    },
  },
} as const;

const mockStep: Step = {
  stepId: "createApp",
  description: "Create a new app.",
  operation: {
    path: "/api/apps",
    method: "post",
  },
  parameters: [
    {
      name: "name",
      in: "query",
      value: "$inputs.name",
    },
    {
      name: "description",
      in: "query",
      value: "$inputs.description",
    },
  ],
  requestBody: {
    contentType: "application/json",
    payload: {
      name: "$inputs.name",
      description: "$inputs.description",
    },
    replacements: [],
  },
  successCriteria: [{ condition: "$response.statusCode === 201" }],
  outputs: [{ key: "appId", value: "$response.body#/data/id" }],
};

const mockWorkflow: Workflow = {
  workflowId: "createAppAndGenerateToken",
  description: "Create app and generate token",
  prompt: "create an app and then create a token from it",
  summary: "Create app and generate token",
  createdAt: new Date(),
  updatedAt: new Date(),
  inputs: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      expiresAt: { type: "number" },
    },
    required: ["name", "description"],
  },
  steps: [
    mockStep,
    {
      stepId: "createTokenForApp",
      description: "Create a token for the newly created app.",
      operation: {
        path: "/api/apps/{appId}/tokens",
        method: "post",
      },
      parameters: [
        {
          name: "appId",
          in: "path",
          value: "$steps.createApp.outputs.appId",
        },
      ],
      requestBody: {
        contentType: "application/json",
        payload: {
          expiresAt: "$inputs.expiresAt",
        },
        replacements: [],
      },
      successCriteria: [{ condition: "$response.statusCode === 201" }],
      outputs: [{ key: "token", value: "$response.body#/data/token" }],
    },
  ],
  outputs: [
    { key: "appId", value: "$steps.createApp.outputs.appId" },
    { key: "token", value: "$steps.createTokenForApp.outputs.token" },
  ],
};

describe("resolveReference", () => {
  it("should return literal values unchanged", () => {
    const result = resolveReference("application/json", mockWorkflowContext);
    expect(result).toBe("application/json");
  });

  it("should resolve input references", () => {
    const result = resolveReference("$inputs.name", mockWorkflowContext);
    expect(result).toBe("Test App");
  });

  it("should resolve response body references", () => {
    const result = resolveReference("$response.body#/data/name", {
      response: mockWorkflowContext.steps.createApp.response!,
    });
    expect(result).toBe("Test App");
  });

  it("should resolve step output references", () => {
    const result = resolveReference(
      "$steps.createApp.outputs.appId",
      mockWorkflowContext,
    );
    expect(result).toBe("c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d");
  });

  it("should resolve JSON pointer in response body", () => {
    const result = resolveReference("$response.body#/data/id", {
      response: mockWorkflowContext.steps.createApp.response!,
    });
    expect(result).toBe("c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d");
  });

  it("should handle template expressions", () => {
    const result = resolveReference(
      "Bearer {$steps.createTokenForApp.outputs.token}",
      mockWorkflowContext,
    );
    expect(result).toBe("Bearer fp_test_token_123");
  });

  it("should return undefined for invalid references", () => {
    const result = resolveReference(
      "$steps.nonexistent.value",
      mockWorkflowContext,
    );
    expect(result).toBeUndefined();
  });
});

describe("resolveStepParams", () => {
  it("should resolve path and method", async () => {
    const result = await resolveStepParams(mockStep, mockWorkflowContext);
    expect(result.path).toBe("/api/apps");
    expect(result.method).toBe("post");
  });

  it("should resolve parameters", async () => {
    const result = await resolveStepParams(mockStep, mockWorkflowContext);
    expect(result.parameters).toEqual({
      name: "Test App",
      description: "A test application",
    });
  });

  it("should resolve request body", async () => {
    const result = await resolveStepParams(mockStep, mockWorkflowContext);
    expect(result.body).toEqual({
      name: "Test App",
      description: "A test application",
    });
  });

  it("should handle steps with no parameters", async () => {
    const emptyStep: Step = {
      stepId: "empty",
      description: "Empty Step",
      operation: {
        path: "/test",
        method: "get",
      },
      parameters: [],
      successCriteria: [],
      outputs: [],
    };
    const result = await resolveStepParams(emptyStep, mockWorkflowContext);
    expect(result).toEqual({
      path: "/test",
      method: "get",
      parameters: {},
    });
  });

  it("should resolve parameters using step outputs", async () => {
    const tokenStep: Step = {
      stepId: "createTokenForApp",
      description: "Create token",
      operation: {
        path: "/api/apps/{appId}/tokens",
        method: "post",
      },
      parameters: [
        {
          name: "appId",
          in: "path",
          value: "$steps.createApp.outputs.appId",
        },
      ],
      successCriteria: [],
      outputs: [],
    };
    const result = await resolveStepParams(tokenStep, mockWorkflowContext);
    expect(result.parameters).toEqual({
      appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
    });
  });
});

describe("resolveOutputs", () => {
  it("should resolve workflow outputs", () => {
    const result = resolveOutputs(mockWorkflow, mockWorkflowContext);
    expect(result).toEqual({
      appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
      token: "fp_test_token_123",
    });
  });

  it("should handle workflows with no outputs", () => {
    const emptyWorkflow: Workflow = {
      ...mockWorkflow,
      outputs: [],
    };
    const result = resolveOutputs(emptyWorkflow, mockWorkflowContext);
    expect(result).toEqual({});
  });

  it("should return undefined for unresolvable outputs", () => {
    const badWorkflow: Workflow = {
      ...mockWorkflow,
      outputs: [{ key: "missing", value: "$steps.nonexistent.value" }],
    };
    const result = resolveOutputs(badWorkflow, mockWorkflowContext);
    expect(result).toEqual({
      missing: undefined,
    });
  });
});

describe("resolveStepOutputs", () => {
  it("should resolve step outputs from response", () => {
    const response = {
      statusCode: 201,
      body: {
        data: {
          id: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
          name: "Test App",
        },
      },
    };

    const result = resolveStepOutputs(mockStep, response);
    expect(result).toEqual({
      appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
    });
  });

  it("should return undefined for steps with no outputs", () => {
    const emptyStep: Step = {
      stepId: "empty",
      description: "Empty Step",
      operation: {
        path: "/test",
        method: "get",
      },
      parameters: [],
      successCriteria: [],
      outputs: [],
    };

    const result = resolveStepOutputs(emptyStep, {
      statusCode: 200,
      body: { data: {} },
    });
    expect(result).toBeUndefined();
  });

  it("should handle JSON pointer expressions in outputs", () => {
    const step: Step = {
      stepId: "test",
      description: "Test step",
      operation: {
        path: "/test",
        method: "get",
      },
      parameters: [],
      successCriteria: [],
      outputs: [{ key: "name", value: "$response.body#/data/name" }],
    };

    const response = {
      statusCode: 200,
      body: {
        data: {
          name: "Test Value",
        },
      },
    };

    const result = resolveStepOutputs(step, response);
    expect(result).toEqual({
      name: "Test Value",
    });
  });
});
