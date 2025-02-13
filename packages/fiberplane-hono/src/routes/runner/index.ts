import { Hono, type Env } from "hono";
import type { FiberplaneAppType } from "../../types.js";
import { sValidator } from "@hono/standard-validator";
import { z, ZodError } from "zod";
import type { Step, Workflow } from "../../schemas/workflows.js";
import { contextStorage, getContext } from "hono/context-storage";
import {
  resolveStepParams,
  resolveStepOutputs,
  type WorkflowContext,
  type HttpRequestParams,
} from "./resolvers.js";
import { resolveOutputs } from "./resolvers.js";
import { formatZodError } from "./utils.js";
import { getWorkflowById } from "./utils.js";

export default function createRunnerRoute<E extends Env>(apiKey: string) {
  const runner = new Hono<E & FiberplaneAppType<E>>()
    .use(contextStorage())
    .post(
      "/:workflowId",
      sValidator("param", z.object({ workflowId: z.string() })),
      async (c) => {
        try {
          const { workflowId } = c.req.valid("param");
          const { data: workflow } = await getWorkflowById(workflowId, apiKey);

          // const inputsSchema = z.object({
          //   inputs: createZodSchemaFromJsonSchema(workflow.inputs),
          // });

          const body = await c.req.json();
          // const validatedBody = inputsSchema.parse(body);
          const result = await executeWorkflow(workflow, body);
          return c.json(result);
        } catch (e) {
          if (e instanceof ZodError) {
            const formattedError = formatZodError(e);
            return c.json({ error: formattedError }, 400);
          }
          return c.json({ error: "Invalid request" }, 400);
        }
      },
    );

  return runner;
}

async function executeWorkflow(
  workflow: Workflow,
  inputs: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const workflowContext: WorkflowContext = {
    inputs,
    steps: {},
  };

  // Execute steps sequentially
  for (const step of workflow.steps) {
    const resolvedParams = await resolveStepParams(step, workflowContext);
    const response = await executeStep(step, resolvedParams);
    const outputs = resolveStepOutputs(step, response);
    workflowContext.steps[step.stepId] = {
      ...(outputs ? { outputs } : {}),
    };
  }

  return resolveOutputs(workflow, workflowContext);
}

async function executeStep<E extends Env>(
  step: Step,
  params: HttpRequestParams,
): Promise<{ statusCode: number; body: unknown }> {
  const c = getContext<E & FiberplaneAppType<E>>();
  const userApp = c.get("userApp");
  const userEnv = c.get("userEnv");
  const baseUrl = new URL(c.req.url).origin;
  const headers = new Headers();

  // Collect all parameters in a single pass
  const { pathname, searchParams } = step.parameters.reduce(
    (acc, param) => {
      const value = String(params.parameters[param.name]);
      switch (param.in) {
        case "path":
          acc.pathname = acc.pathname.replace(`{${param.name}}`, value);
          break;
        case "query":
          acc.searchParams += `${acc.searchParams ? "&" : ""}${encodeURIComponent(param.name)}=${encodeURIComponent(value)}`;
          break;
        case "header":
          headers.append(param.name, value);
          break;
      }
      return acc;
    },
    { pathname: params.path, searchParams: "" },
  );

  // Construct URL with all parameters
  const url = new URL(
    pathname + (searchParams ? `?${searchParams}` : ""),
    baseUrl,
  );

  if (params.body) {
    headers.append("Content-Type", "application/json");
  }

  const request = new Request(url, {
    method: params.method.toUpperCase(),
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const response = await userApp.request(request, {}, userEnv);

  const responseBody = await response.json();

  return {
    statusCode: response.status,
    body: responseBody,
  };
}
