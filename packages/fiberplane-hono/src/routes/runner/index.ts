import { Hono, type Env } from "hono";
import type { FiberplaneAppType } from "../../types.js";
import { sValidator } from "@hono/standard-validator";
import { z } from "zod";
import type { Step, Workflow } from "../../schemas/workflows.js";
import { getContext } from "hono/context-storage";
import {
  resolveStepParams,
  resolveStepOutputs,
  type WorkflowContext,
  type HttpRequestParams,
} from "./resolvers.js";
import { resolveOutputs } from "./resolvers.js";
import { getWorkflowById } from "./utils.js";
// TODO: ideally we'd replace this with a zod validator but cheaper and simpler
// to use a basic json schema validator for now
import { Validator } from "@cfworker/json-schema";

export default function createRunnerRoute<E extends Env>(apiKey: string) {
  const runner = new Hono<E & FiberplaneAppType<E>>()
    .post(
      "/:workflowId",
      sValidator("param", z.object({ workflowId: z.string() })),
      async (c) => {
        const { workflowId } = c.req.valid("param");
        const { data: workflow } = await getWorkflowById(workflowId, apiKey);

        const validator = new Validator(workflow.inputs);

        const body = await c.req.json();

        const { valid, errors } = validator.validate(body);
        if (!valid) {
          const errorMessage = errors.map((error) => error.error).join("\n");
          return c.json({ error: errorMessage }, 400);
        }

        const result = await executeWorkflow(workflow, body);
        return c.json(result);
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
