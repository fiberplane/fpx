import { Hono } from "hono";
import { FiberplaneAppType } from "../../types.js";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PLAYGROUND_SERVICES_URL } from "../../constants.js";
import { Step, Workflow } from "../../schemas/workflows.js";
import { HTTPException } from "hono/http-exception";
import { contextStorage } from "hono/context-storage";

type RunnerAppType = FiberplaneAppType & {
  Variables: {
    app: Hono<RunnerAppType>;
  };
};

export default function createRunnerApiRoute(apiKey: string) {
  const runner = new Hono<RunnerAppType>()
    .use(contextStorage())
    .use(async (c, next) => {
      c.set("app", runner);
      await next();
    })
    .post(
      "/{workflowId}",
      // @ts-ignore
      zValidator("param", z.object({ workflowId: z.string() })),
      async (c) => {
        const { workflowId } = c.req.valid("param");

        const { data: workflow } = await getWorkflowById(workflowId, apiKey);

        const inputsSchema = z.object({
          inputs: createZodSchemaFromJsonSchema(workflow.inputs),
        });

        const body = await c.req.json();
        const validatedBody = inputsSchema.parse(body);

        return executeWorkflow(workflow, validatedBody.inputs);
      },
    );

  return runner;
}

interface WorkflowContext {
  inputs: Record<string, any>;
  steps: Record<string, Record<string, any>>;
}

async function executeWorkflow(
  workflow: Workflow,
  inputs: Record<string, any>,
): Promise<Record<string, any>> {
  console.log('🚀 Starting workflow execution:', {
    workflowId: workflow.workflowId,
    stepCount: workflow.steps.length,
    inputs
  });

  const workflowContext: WorkflowContext = {
    inputs: inputs,
    steps: {},
  };

  // Execute steps sequentially
  for (const step of workflow.steps) {
    console.log(`\n📍 Executing step: ${step.stepId}`, {
      type: step.operation,
      parameters: step.parameters
    });

    const resolvedParams = await resolveStepParams(step, workflowContext);
    console.log('🔍 Resolved parameters:', resolvedParams);

    const stepResult = await executeStep(step, resolvedParams);
    console.log('✅ Step result:', stepResult);

    workflowContext.steps[step.stepId] = stepResult;
  }

  const outputs = resolveOutputs(workflow, workflowContext);
  console.log('\n🏁 Workflow completed. Final outputs:', outputs);

  return outputs;
}

async function executeStep(
  step: Step,
  params: Record<string, any>,
): Promise<Record<string, any>> {
  const req = new Request(step.operation)
  // For now, just return the params as the result
  // This will be expanded in the next phase
  return params;
}

export function resolveReference(value: string, context: WorkflowContext): any {
  console.log('🔎 Resolving reference:', value);

  // If not an expression, return as is
  if (!value.startsWith("$") && !value.includes("{$")) {
    return value;
  }

  // Handle template expressions like "Bearer {$steps.authenticate.accessToken}"
  if (value.includes("{$")) {
    return value.replace(/\{([^}]+)\}/g, (_, expr) => {
      const resolved = resolveReference(expr, context);
      return resolved === undefined ? "" : String(resolved);
    });
  }

  // Parse the expression parts
  const [basePath, jsonPointer] = value.split("#");
  const parts = basePath.split(".");
  const expressionType = parts[0].substring(1); // Remove $ prefix

  // Get the base value based on expression type
  let baseValue: any;
  switch (expressionType) {
    case "inputs":
      baseValue = context.inputs;
      parts.shift(); // Remove 'inputs'
      break;
    case "steps":
      baseValue = context.steps;
      parts.shift(); // Remove 'steps'
      break;
    default:
      return undefined;
  }

  // Resolve the path
  for (const part of parts) {
    if (baseValue === undefined || baseValue === null) {
      return undefined;
    }
    baseValue = baseValue[part];
  }

  // If there's a JSON pointer, resolve it
  if (jsonPointer) {
    try {
      // Remove leading slash as jsonpointer lib expects it without
      const pointer = jsonPointer.startsWith("/")
        ? jsonPointer.substring(1)
        : jsonPointer;
      // Handle JSON Pointer escaping:
      // ~1 = / (for keys containing slashes, e.g., "/path/to/something" becomes "path~1to~1something")
      // ~0 = ~ (for keys containing tildes)
      const segments = pointer
        .split("/")
        .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));

      for (const segment of segments) {
        if (baseValue === undefined || baseValue === null) {
          return undefined;
        }
        // This allows us to access objects like { "/path/to/something": value }
        // using the JSON Pointer "#/path~1to~1something"
        baseValue = baseValue[segment];
      }
    } catch {
      return undefined;
    }
  }

  const result = baseValue;
  console.log('📌 Resolved value:', result);
  return result;
}

export async function resolveStepParams(
  step: Step,
  context: WorkflowContext,
): Promise<Record<string, any>> {
  console.log(`\n🔧 Resolving parameters for step: ${step.stepId}`);
  const params: Record<string, any> = {};

  for (const param of step.parameters) {
    console.log(`  Parameter: ${param.name} = ${param.value}`);
    // Note: param.name can use dot notation (e.g., "headers.Authorization")
    // This is different from JSON Pointer notation which uses "/" and requires escaping
    params[param.name] = resolveReference(param.value, context);
  }

  return params;
}

export function resolveOutputs(
  workflow: Workflow,
  context: WorkflowContext,
): Record<string, any> {
  const outputs: Record<string, any> = {};

  for (const output of workflow.outputs) {
    outputs[output.key] = resolveReference(output.value, context);
  }

  return outputs;
}

async function getWorkflowById(
  workflowId: string,
  apiKey: string,
): Promise<{ data: Workflow }> {
  const workflowResponse = await fetch(
    `${PLAYGROUND_SERVICES_URL}/api/workflows/${workflowId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!workflowResponse.ok) {
    throw new HTTPException(404, { message: "Workflow not found" });
  }

  return await workflowResponse.json();
}

function createZodSchemaFromJsonSchema(jsonSchema: any): z.ZodType {
  if (!jsonSchema || Object.keys(jsonSchema).length === 0) {
    return z.record(z.any());
  }

  switch (jsonSchema.type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "object":
      if (jsonSchema.properties) {
        const shape: Record<string, z.ZodType> = {};
        for (const [key, value] of Object.entries(jsonSchema.properties)) {
          shape[key] = createZodSchemaFromJsonSchema(value);
        }
        const schema = z.object(shape);
        return jsonSchema.required?.length
          ? schema.required(jsonSchema.required)
          : schema;
      }
      return z.record(z.any());
    case "array":
      return z.array(
        jsonSchema.items
          ? createZodSchemaFromJsonSchema(jsonSchema.items)
          : z.any(),
      );
    default:
      return z.any();
  }
}
