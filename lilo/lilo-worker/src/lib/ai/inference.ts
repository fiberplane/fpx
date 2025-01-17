import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import {
  PLANNER_SYSTEM_PROMPT,
  STEP_REQUEST_EVALUATION_SYSTEM_PROMPT,
  STEP_RESPONSE_EVALUATION_SYSTEM_PROMPT,
  createPlanUserPrompt,
} from "./prompts";

// NOTE - Gemini does not play nicely with unions
//        So I removed `nullable` from the request schema
const geminiRequestSchema = z.object({
  path: z.string(),
  pathParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  queryParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  body: z.string().nullable(),
  bodyType: z.object({
    type: z.enum(["json", "text", "form-data", "file"]),
    isMultipart: z.boolean(),
  }),
  headers: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
});

const PlanStepSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "the reason for calling this endpoint at this point in the sequence",
    ),
  routeId: z.number(),
  route: z.object({
    id: z.number(),
    path: z.string(),
    method: z.string(),
  }),
  exampleRequest: geminiRequestSchema.describe(
    "Example request for the route handler",
  ),
  expectedOutput: z
    .string()
    .describe("a summary of the expected output for this api call"),
  dependencies: z
    .array(z.string())
    .describe(
      "The fully qualified dotpath of the dependencies on other steps in the execution plan",
    ),
});

type PlanStep = z.infer<typeof PlanStepSchema>;

// NOTE - We cannot use `.optional` or `.nullable` from zod because it does not play nicely with structured output from openai... or gemini
const GeminiPlanOutputSchema = z.object({
  stepByStepReasoning: z.string(),
  executionPlanSteps: z.array(PlanStepSchema),
});

/**
 * Schema for the create plan request
 *
 * When you send this along, you will want
 */
const CreatePlanSchema = z.object({
  prompt: z.string().describe("The prompt to use for the plan creation"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .describe(
      "The history of messages between the user and the AI, in ascending order (oldest messages first)",
    ),
});

const NextStepSchema = z.object({
  plan: z.object({
    description: z.string(),
    steps: z.array(PlanStepSchema),
  }),
  currentStepIdx: z.number(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  previousResults: z.array(z.any()).nullable(),
});

const EvaluateNextStepAiResponseSchema = z.object({
  action: z.enum(["execute", "awaitInput"]),
  message: z.string().describe("A message to the user about the next step"),
  modifiedStep: PlanStepSchema,
});

const EvaluateStepResponseAiResponseSchema = z.object({
  action: z.enum(["continue", "awaitInput"]),
  message: z.string().describe("A message to the user about the next step"),
});

const createStepResponseEvaluationUserPrompt = (
  step: PlanStep,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  stepResponse: any,
) => {
  return `
You are an evaluator for a testing workflow.

I need you to confirm that my most recent response for a step is expected, given our testing plan.

If so, respond with "continue".
If not, respond with "awaitInput".

# Step
${JSON.stringify(step, null, 2)}

# Response
${JSON.stringify(stepResponse, null, 2)}

# Further instructions for you
Provide CONCISE reasoning for why in plaintext. no markdown.
`.trim();
};

const createStepEvaluationUserPrompt = (
  currentStep: z.infer<typeof PlanStepSchema>,
  previousResults: z.infer<typeof NextStepSchema>["previousResults"],
) => {
  return `
I need you to modify this to fit the existing testing plan. 
Sub in variables as necessary and correct any incorrect headers or things that need like auth tokens or whatever.

# Existing Plan
${JSON.stringify(currentStep, null, 2)}

# Previous Results
${JSON.stringify(previousResults, null, 2)}

===

Always response in valid json according to the schema i provided.
`;
};

export async function evaluateNextStep({
  plan,
  currentStepIdx,
  messages: history,
  previousResults,
}: z.infer<typeof NextStepSchema>) {
  const currentStep = plan.steps[currentStepIdx];

  const model = google("gemini-1.5-pro-latest");

  const messages = [
    ...(history ?? []),
    { role: "assistant" as const, content: JSON.stringify(plan) },
    {
      role: "user" as const,
      content: createStepEvaluationUserPrompt(currentStep, previousResults),
    },
  ];

  const aiResponse = await generateObject({
    model,
    schema: EvaluateNextStepAiResponseSchema,
    system: STEP_REQUEST_EVALUATION_SYSTEM_PROMPT,
    temperature: 0.1,
    messages,
  });

  return {
    action: aiResponse.object.action,
    message: aiResponse.object.message,
    modifiedStep: transformPlanStep(aiResponse.object.modifiedStep),
  };
}

export async function evaluateStepResponse({
  plan,
  currentStepIdx,
  response: stepResponse,
}: {
  plan: z.infer<typeof NextStepSchema>["plan"];
  currentStepIdx: number;
  response: z.infer<typeof EvaluateNextStepAiResponseSchema>;
}) {
  const currentStep = plan.steps[currentStepIdx];

  const model = google("gemini-1.5-pro-latest");

  const messages = [
    { role: "assistant" as const, content: JSON.stringify(plan) },
    {
      role: "user" as const,
      content: createStepResponseEvaluationUserPrompt(
        currentStep,
        stepResponse,
      ),
    },
  ];

  const aiResponse = await generateObject({
    model,
    schema: EvaluateStepResponseAiResponseSchema,
    system: STEP_RESPONSE_EVALUATION_SYSTEM_PROMPT,
    temperature: 0.4,
    messages,
  });

  return {
    action: aiResponse.object.action,
    message: aiResponse.object.message,
  };
}

/**
 * @TODO - Bring in the api spec!!!
 */
export async function createPlan(o: z.infer<typeof CreatePlanSchema>) {
  const { prompt: userStory, messages: history } = o;
  const model = google("gemini-1.5-pro-latest");
  const expandedRouteHandlers: string[] = [];

  const userPrompt = createPlanUserPrompt(
    userStory,
    expandedRouteHandlers
      // .map(
      //   (r) => `Route ${r.routeId}: ${r.method} ${r.path}\n\n${r.context}`,
      // )
      .join("\n\n"),
  );

  const messages = [
    ...(history ?? []),
    {
      role: "user" as const,
      content: userPrompt,
    },
  ];
  console.time("Create Plan Gemini call");
  const result = await generateObject({
    model: model,
    schema: GeminiPlanOutputSchema,
    system: PLANNER_SYSTEM_PROMPT,
    temperature: 0.1,
    messages,
  });
  console.timeEnd("Create Plan Gemini call");
  const { object } = result;
  const plan = object.executionPlanSteps.map(transformPlanStep);
  return {
    description: object.stepByStepReasoning,
    plan,
  };
}

function transformPlanStep(step: PlanStep) {
  return {
    routeId: step.route.id,
    route: step.route,
    reasoning: step.reasoning,
    expectedOutput: step.expectedOutput,
    dependencies: step.dependencies,

    // NOTE: This is the shape of the data expected by the zustand store
    payload: step.exampleRequest,
  };
}
