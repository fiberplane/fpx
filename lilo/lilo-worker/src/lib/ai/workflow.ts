import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

// Parameter schema following Arazzo spec
const ParameterSchema = z
  .object({
    name: z
      .string()
      .describe("The name of the parameter to be used in the operation"),
    in: z
      .enum(["path", "query", "header", "cookie"])
      .describe(
        "The location of the parameter in the request. Example: 'query' for ?param=value",
      ),
    value: z
      .union([z.string(), z.number(), z.boolean()])
      .describe(
        "The value of the parameter. Can be string, number, or boolean",
      ),
  })
  .describe(
    "Defines how parameters are passed to operations. Example: { name: 'userId', in: 'path', value: '123' }",
  );

// Criterion schema for success/failure conditions
const CriterionSchema = z
  .object({
    context: z
      .string()
      .optional()
      .describe(
        "Optional context for evaluating the condition. Example: 'response.body'",
      ),
    condition: z
      .string()
      .describe(
        "The condition to evaluate. Example: 'status == 200' or '$.data.length > 0'",
      ),
    type: z
      .enum(["simple", "regex", "jsonpath", "xpath"])
      .optional()
      .describe("The type of condition evaluation. Default is 'simple'"),
  })
  .describe(
    "Defines conditions for success or failure. Example: { condition: 'status == 200', type: 'simple' }",
  );

// Success/Failure action schema
const ActionSchema = z
  .object({
    name: z.string().describe("Identifier for the action"),
    type: z
      .enum(["end", "goto", "retry"])
      .describe(
        "Type of action to perform: end workflow, goto another step, or retry current step",
      ),
    workflowId: z
      .string()
      .optional()
      .describe("Target workflow ID for 'goto' actions between workflows"),
    stepId: z
      .string()
      .optional()
      .describe("Target step ID for 'goto' actions within the same workflow"),
    retryAfter: z
      .number()
      .optional()
      .describe("Delay in milliseconds before retry attempt"),
    retryLimit: z
      .number()
      .optional()
      .describe("Maximum number of retry attempts"),
    criteria: z
      .array(CriterionSchema)
      .optional()
      .describe("Conditions that must be met for the action to execute"),
  })
  .describe(
    "Defines what happens on success or failure. Example: { name: 'retry-on-429', type: 'retry', retryAfter: 1000 }",
  );

// Step schema
const StepSchema = z
  .object({
    stepId: z
      .string()
      .describe("Unique identifier for the step within the workflow"),
    description: z
      .string()
      .optional()
      .describe("Human-readable description of what the step does"),
    operationId: z
      .string()
      .optional()
      .describe("Reference to an operation in the API specification"),
    operationPath: z
      .string()
      .optional()
      .describe("Direct path to the operation. Example: '/api/v1/users'"),
    workflowId: z
      .string()
      .optional()
      .describe("Reference to another workflow for composition"),
    parameters: z
      .array(ParameterSchema)
      .optional()
      .describe("Parameters to pass to the operation"),
    successCriteria: z
      .array(CriterionSchema)
      .optional()
      .describe("Conditions that determine if the step succeeded"),
    onSuccess: z
      .array(ActionSchema)
      .optional()
      .describe("Actions to take when the step succeeds"),
    onFailure: z
      .array(ActionSchema)
      .optional()
      .describe("Actions to take when the step fails"),
    outputs: z
      .record(z.string())
      .optional()
      .describe("Mappings to extract values from the response"),
  })
  .describe(
    "Defines a single step in the workflow. Each step represents an operation or sub-workflow",
  );

// Main workflow schema
const WorkflowSchema = z.object({
  workflowId: z.string().describe("Unique identifier for the workflow"),
  summary: z
    .string()
    .optional()
    .describe("Brief summary of the workflow's purpose"),
  description: z
    .string()
    .optional()
    .describe("Detailed description of what the workflow does"),
  inputs: z
    .record(z.any())
    .optional()
    .describe("Input parameters required to start the workflow"),
  dependsOn: z
    .array(z.string())
    .optional()
    .describe("IDs of workflows that must complete before this one can start"),
  steps: z.array(StepSchema).describe("Ordered sequence of steps to execute"),
  successActions: z
    .array(ActionSchema)
    .optional()
    .describe("Actions to take when the entire workflow succeeds"),
  failureActions: z
    .array(ActionSchema)
    .optional()
    .describe("Actions to take when the workflow fails"),
  outputs: z
    .record(z.string())
    .optional()
    .describe("Values to extract from the workflow execution"),
}).describe(`Defines a complete workflow that orchestrates multiple steps.
Example:
{
  workflowId: "create-user-workflow",
  summary: "Create new user and setup preferences",
  description: "Creates a new user account, sets up their preferences, and sends a welcome email",
  inputs: {
    email: "string",
    username: "string",
    preferredTheme: "string"
  },
  steps: [
    {
      stepId: "validate-email",
      operationPath: "/api/v1/validation/email",
      parameters: [
        { name: "email", in: "query", value: "$.inputs.email" }
      ],
      successCriteria: [
        { condition: "status == 200" }
      ],
      onFailure: [
        { 
          name: "handle-invalid-email",
          type: "end",
          criteria: [{ condition: "status == 400" }]
        }
      ]
    },
    {
      stepId: "create-user",
      operationPath: "/api/v1/users",
      parameters: [
        { name: "email", in: "query", value: "$.inputs.email" },
        { name: "username", in: "query", value: "$.inputs.username" }
      ],
      successCriteria: [
        { condition: "status == 201" }
      ],
      outputs: {
        userId: "$.response.body.id"
      },
      onFailure: [
        {
          name: "retry-on-conflict",
          type: "retry",
          retryAfter: 1000,
          retryLimit: 3,
          criteria: [{ condition: "status == 409" }]
        }
      ]
    },
    {
      stepId: "set-preferences",
      operationPath: "/api/v1/users/{userId}/preferences",
      parameters: [
        { name: "userId", in: "path", value: "$.outputs.userId" },
        { name: "theme", in: "query", value: "$.inputs.preferredTheme" }
      ],
      successCriteria: [
        { condition: "status == 200" }
      ]
    },
    {
      stepId: "send-welcome-email",
      operationPath: "/api/v1/notifications/email",
      parameters: [
        { name: "to", in: "query", value: "$.inputs.email" },
        { name: "template", in: "query", value: "welcome" }
      ],
      successCriteria: [
        { condition: "status == 202" }
      ],
      onFailure: [
        {
          name: "retry-email",
          type: "retry",
          retryAfter: 5000,
          retryLimit: 5
        }
      ]
    }
  ],
  successActions: [
    {
      name: "log-completion",
      type: "goto",
      workflowId: "audit-log-workflow",
      stepId: "log-user-creation"
    }
  ],
  outputs: {
    userId: "$.steps.create-user.outputs.userId",
    emailDeliveryStatus: "$.steps.send-welcome-email.status"
  }
}`);

export async function createWorkflow({
  openApiSpec,
  userStory,
  apiKey,
}: {
  openApiSpec: string;
  userStory: string;
  apiKey: string;
}): Promise<{
  workflow: z.infer<typeof WorkflowSchema>;
}> {
  const aiClient = createAnthropic({
    apiKey,
  });

  const prompt = createWorkflowPrompt(openApiSpec, userStory);

  const result = await generateObject({
    model: aiClient("claude-3-5-sonnet-latest"),
    schema: WorkflowSchema,
    prompt,
  });

  return {
    workflow: result.object,
  };
}

function createWorkflowPrompt(openApiSpec: string, userStory: string): string {
  return `
You are an AI assistant tasked with transforming a natural language user story into a structured workflow that maps to a series of API calls. Your goal is to create a detailed workflow description that follows the provided schema and includes realistic sample data.

First, I will provide you with an API specification. This specification describes the available endpoints and operations that can be used in the workflow. Please analyze this information carefully as you will need to reference it when creating the workflow.

<open_api_spec>
${openApiSpec}
</open_api_spec>

Next, I will give you a user story. This story describes a business process or user journey that needs to be implemented as a workflow using the available API operations.

<user_story>
${userStory}
</user_story>

To create the workflow, follow these steps:

1. Carefully read and analyze the user story to identify the main steps and requirements.

2. Break down the user story into discrete steps that can be mapped to API operations from the provided specification.

3. Create a workflow structure that includes:
   - A unique workflowId
   - A summary of the workflow's purpose
   - A detailed description of what the workflow does
   - Any required input parameters

4. For each step in the workflow:
   - Assign a unique stepId
   - Identify the corresponding API operation (operationId or operationPath)
   - Define necessary parameters, matching them to the API specification
   - Set appropriate successCriteria
   - Define onSuccess and onFailure actions
   - Specify any outputs that should be captured from the response

5. Set up input and output mappings to pass data between steps and to/from the overall workflow.

6. Implement error handling and retry logic where appropriate, especially for operations that might fail due to temporary issues.

7. Define overall successActions and failureActions for the entire workflow if needed.

When creating sample data:
- Use realistic, non-trivial examples that demonstrate the workflow's functionality
- Ensure that the sample data is consistent across all steps of the workflow
- Avoid using placeholder values like "test" or "example"

Format your output according to the provided schema, ensuring that all required fields are included and properly structured. Use JSON format for the workflow definition.

Remember to:
- Use JSONPath expressions (e.g., $.inputs.email) to reference values from previous steps or inputs
- Include appropriate error handling and retry mechanisms
- Provide clear descriptions for each step and the overall workflow
- Ensure that the workflow logic accurately represents the user story requirements
`;
}
