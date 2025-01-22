export function createWorkflowPlanPrompt(openApiSpec: string, userStory: string) {
  return `Analyze this user story and create a clear workflow plan using only operations available in the OpenAPI specification.

OpenAPI Specification:
<openApiSpec>
${openApiSpec}
</openApiSpec>

User Story:
<userStory>
${userStory}
</userStory>

Create a workflow plan that:
1. Lists the exact operation IDs or paths from the supplied OpenAPI spec that will be needed
2. Describes step by step what the workflow will do
3. Explains what data needs to be passed between steps

Your response must be clear and concise, focusing only on available operations from the spec.
Do not invent or assume the existence of operations not defined in the spec.
If you invent an operation that does not exist in the openApiSpec, you will be penalized.
`;
}

export function createWorkflowHeaderPrompt(openApiSpec: string, workflowPlan: string) {
  return `Create a workflow header based on this workflow plan. Only output valid JSON - no explanations or additional text.

OpenAPI Specification for reference:
${openApiSpec}

Workflow Plan:
${workflowPlan}

The output must follow this structure:
{
  "id": "loginUserAndCreateWorkflow",
  "summary": "Login user and create workflow",
  "description": "Handles user login and workflow creation"
}

REMEMBER:
- Only output valid JSON. If you output anything else, you will be penalized.
- You are returning JSON directly, not markdown. Do not prepend or append any text to your output.
- NO \`\`\`json backticks.
`;
}

export function createStructuredWorkflowPrompt(openApiSpec: string, workflowPlan: string, workflowHeader: { id: string; summary: string; description: string }) {
  return `Generate workflow steps based on this plan and workflow header. Only output valid JSON - no explanations or additional text.

OpenAPI Specification for reference:
${openApiSpec}

Workflow Plan:
${workflowPlan}

Workflow Header:
{
  "id": "${workflowHeader.id}",
  "summary": "${workflowHeader.summary}",
  "description": "${workflowHeader.description}"
}

Each step must follow this structure:
{
  "stepId": "stepName",
  "description": "What this step does",
  "operation": "operationId-or-path-from-spec",
  "parameters": [
    {
      "name": "paramName",
      "value": "$inputs.someInput"
    }
  ],
  "successCriteria": [
    {
      "condition": "$response.statusCode === 200"
    }
  ],
  "outputs": [
    {
      "key": "outputName",
      "value": "$response.body#/data"
    }
  ]
}

REMEMBER:
- Use real operation IDs or paths from the OpenAPI spec
- Use proper runtime expressions:
* $inputs.* for workflow inputs
* $steps.stepId.outputs.* for previous step outputs
* $response.statusCode for HTTP status
* $response.body#/path/to/value for response data
* $response.header.HeaderName for HTTP headers
- Only output valid JSON. If you output anything else, you will be penalized.
- NO \`\`\`json or \`\`\` backticks or you will be penalized.
`;
}
