import { describe, it, expect } from "vitest";
import { Step, Workflow } from "../../schemas/workflows.js";
import {
  resolveReference,
  resolveStepParams,
  resolveOutputs,
} from "./index.js";

// Test fixtures
const mockWorkflowContext = {
  inputs: {
    name: "Test App",
    description: "A test application",
    expiresAt: 1728374400000
  },
  steps: {
    createApp: {
      outputs: {
        appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d"
      },
      response: {
        statusCode: 201,
        body: {
          data: {
            id: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
            name: "Test App",
            description: "A test application"
          }
        }
      }
    },
    createTokenForApp: {
      outputs: {
        token: "fp_test_token_123"
      },
      response: {
        statusCode: 201,
        body: {
          data: {
            token: "fp_test_token_123",
            expiresAt: 1728374400000
          }
        }
      }
    }
  }
};

const mockStep: Step = {
  stepId: "createApp",
  description: "Create a new app.",
  operation: "post /api/apps",
  parameters: [
    { name: "name", value: "$inputs.name" },
    { name: "description", value: "$inputs.description" }
  ],
  successCriteria: [
    { condition: "$response.statusCode === 201" }
  ],
  outputs: [
    { key: "appId", value: "$response.body#/data/id" }
  ]
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
      name: { type: "string", maxLength: 255 },
      description: { type: "string", maxLength: 255 },
      expiresAt: { type: "number" }
    },
    required: ["name", "description"]
  },
  steps: [
    {
      stepId: "createApp",
      description: "Create a new app.",
      operation: "post /api/apps",
      parameters: [
        { name: "name", value: "$inputs.name" },
        { name: "description", value: "$inputs.description" }
      ],
      successCriteria: [
        { condition: "$response.statusCode === 201" }
      ],
      outputs: [
        { key: "appId", value: "$response.body#/data/id" }
      ]
    },
    {
      stepId: "createTokenForApp",
      description: "Create a token for the newly created app.",
      operation: "post /api/apps/{id}/tokens",
      parameters: [
        { name: "id", value: "$steps.createApp.outputs.appId" },
        { name: "expiresAt", value: "$inputs.expiresAt" }
      ],
      successCriteria: [
        { condition: "$response.statusCode === 201" }
      ],
      outputs: [
        { key: "token", value: "$response.body#/data/token" }
      ]
    }
  ],
  outputs: [
    { key: "appId", value: "$steps.createApp.outputs.appId" },
    { key: "token", value: "$steps.createTokenForApp.outputs.token" }
  ]
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

  it("should resolve nested input references", () => {
    const result = resolveReference(
      "$steps.createApp.response.body.data.name",
      mockWorkflowContext,
    );
    expect(result).toBe("Test App");
  });

  it("should resolve step output references", () => {
    const result = resolveReference(
      "$steps.createApp.outputs.appId",
      mockWorkflowContext,
    );
    expect(result).toBe("c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d");
  });

  it("should resolve JSON pointer in step outputs", () => {
    const result = resolveReference(
      "$steps.createApp.response.body#/data/id",
      mockWorkflowContext,
    );
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

  it("should resolve step output references with response body", () => {
    const result = resolveReference(
      "$steps.createApp.response.body#/data/id",
      mockWorkflowContext
    );
    expect(result).toBe("c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d");
  });

  it("should resolve step outputs using outputs object", () => {
    const result = resolveReference(
      "$steps.createApp.outputs.appId",
      mockWorkflowContext
    );
    expect(result).toBe("c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d");
  });
});

describe("resolveStepParams", () => {
  it("should resolve all parameter values", async () => {
    const result = await resolveStepParams(mockStep, mockWorkflowContext);
    expect(result).toEqual({
      name: "Test App",
      description: "A test application"
    });
  });

  it("should handle steps with no parameters", async () => {
    const emptyStep: Step = {
      stepId: "empty",
      description: "Empty Step",
      operation: "test/operation",
      parameters: [],
      successCriteria: [],
      outputs: [],
    };
    const result = await resolveStepParams(emptyStep, mockWorkflowContext);
    expect(result).toEqual({});
  });

  it("should resolve parameters using step outputs", async () => {
    const tokenStep = mockWorkflow.steps[1]; // createTokenForApp step
    const result = await resolveStepParams(tokenStep, mockWorkflowContext);
    expect(result).toEqual({
      id: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
      expiresAt: 1728374400000
    });
  });
});

describe("resolveOutputs", () => {
  it("should resolve all workflow outputs", () => {
    const result = resolveOutputs(mockWorkflow, mockWorkflowContext);
    expect(result).toEqual({
      appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
      token: "fp_test_token_123"
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

  it("should resolve workflow outputs using step outputs", () => {
    const result = resolveOutputs(mockWorkflow, mockWorkflowContext);
    expect(result).toEqual({
      appId: "c08e1c2e-6f68-41fd-8b1f-d2b2f5198e5d",
      token: "fp_test_token_123"
    });
  });
});
