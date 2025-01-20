import { generateObject, generateText, JSONParseError } from "ai";
import { getContext } from "hono/context-storage";
import { createWorkersAI } from "workers-ai-provider";
import { workflowSchema, type Workflow } from "../schemas/arazzo.js";
import {
  createWorkflowPlanPrompt,
  createWorkflowHeaderPrompt,
  createStructuredWorkflowPrompt,
} from "./prompts.js";

interface GenerateWorkflowProps {
  userStory: string;
  oaiSchema: string;
}

type WorkflowHeader = Pick<Workflow, "workflowId" | "summary" | "description">;

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withExponentialRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (error instanceof Error && error.name === "InferenceUpstreamError") {
        const delayMs = BASE_DELAY_MS * (2 ** attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delayMs}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

async function withJsonParseRetry<T>(
  operation: (feedback?: string) => Promise<T>
): Promise<T> {
  let lastError: Error | null = null;
  let feedback: string | undefined;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation(feedback);
    } catch (error) {
      lastError = error as Error;
      if (error instanceof JSONParseError) {
        const delayMs = BASE_DELAY_MS * (2 ** attempt);
        feedback = `Previous attempt failed with error: ${error.message}. Please ensure the response is valid JSON matching the schema.`;
        console.log(`JSON parse error, retry attempt ${attempt + 1} after ${delayMs}ms delay with feedback`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError;
}

export async function generateWorkflow({
  userStory,
  oaiSchema,
}: GenerateWorkflowProps) {
  const ai = createWorkersAI({
    binding: getContext<{
      Bindings: CloudflareBindings;
    }>().env.AI,
  });

  try {
    console.log("Step 1: Generating workflow plan...");
    console.log("User story:", userStory);

    // Step 1: Generate workflow plan in natural language
    const planPrompt = createWorkflowPlanPrompt(oaiSchema, userStory);
    let workflowPlan: string;
    try {
      const { text } = await withExponentialRetry(() => 
        generateText({
          model: ai(MODEL, {
            gateway: { id: "lau-fp" },
          }),
          prompt: planPrompt,
        })
      );
      workflowPlan = text;
      console.log("Generated workflow plan:", workflowPlan);
    } catch (error) {
      console.error("Failed to generate workflow plan:", error);
      throw new Error(
        `Failed to generate workflow plan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("Step 2: Generating workflow header...");

    // Step 2: Generate workflow header
    const headerPrompt = createWorkflowHeaderPrompt(oaiSchema, workflowPlan);
    let workflowHeader: WorkflowHeader;
    try {
      const { object } = await withJsonParseRetry((feedback) =>
        generateObject({
          model: ai(MODEL, {
            gateway: { id: "lau-fp" },
          }),
          schema: workflowSchema.pick({
            workflowId: true,
            summary: true,
            description: true,
          }),
          prompt: feedback ? `${headerPrompt}\n\n${feedback}` : headerPrompt,
        })
      );
      workflowHeader = object as WorkflowHeader;
      console.log("Generated workflow header:", workflowHeader);
    } catch (error) {
      console.error("Failed to generate workflow header:", error);
      throw new Error(
        `Failed to generate workflow header: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("Step 3: Generating workflow steps...");

    // Step 3: Generate workflow steps
    const stepsPrompt = createStructuredWorkflowPrompt(
      oaiSchema,
      workflowPlan,
      workflowHeader,
    );
    let workflow: Workflow;
    try {
      const { object } = await withJsonParseRetry((feedback) =>
        generateObject({
          model: ai(MODEL, {
            gateway: { id: "lau-fp" },
          }),
          schema: workflowSchema,
          prompt: feedback ? `${stepsPrompt}\n\n${feedback}` : stepsPrompt,
        })
      );
      workflow = object as Workflow;
      console.log("Generated workflow:", workflow);
    } catch (error) {
      console.error("Failed to generate workflow:", error);
      throw new Error(
        `Failed to generate workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Validate and return
    try {
      const validated = workflowSchema.parse(workflow);
      console.log("Successfully validated schema");
      return validated;
    } catch (error) {
      console.error("Schema validation failed:", error);
      throw new Error(
        `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    console.error("Workflow generation failed:", error);
    throw error;
  }
}
