import { generateObject, generateText } from "ai";
import { getContext } from "hono/context-storage";
import { createWorkersAI } from "workers-ai-provider";
import {
  llmWorkflowSchema,
  convertLLMtoArazzoWorkflow,
  workflowSchema,
  type LLMWorkflow,
  type Workflow,
} from "../schemas/arazzo.js";
import {
  createWorkflowPlanPrompt,
  createStructuredWorkflowPrompt,
} from "./prompts.js";

interface GenerateWorkflowProps {
  userStory: string;
  oaiSchema: string;
}

const MODEL = "@cf/meta/llama-3.2-3b-instruct";

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
      const { text } = await generateText({
        model: ai(MODEL, {
          gateway: { id: "lau-fp" },
        }),
        prompt: planPrompt,
      });
      workflowPlan = text;
      console.log("Generated workflow plan:", workflowPlan);
    } catch (error) {
      console.error("Failed to generate workflow plan:", error);
      throw new Error(
        `Failed to generate workflow plan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("Step 2: Converting plan to structured format...");

    // Step 2: Convert plan to structured format
    const structuredPrompt = createStructuredWorkflowPrompt(
      oaiSchema,
      workflowPlan,
    );
    let llmResult: LLMWorkflow;
    try {
      const { object } = await generateObject({
        model: ai(MODEL, {
          gateway: { id: "lau-fp" },
        }),
        schema: llmWorkflowSchema,
        prompt: structuredPrompt,
      });
      llmResult = object;
      console.log("Generated structured format:", llmResult);
    } catch (error) {
      console.error("Failed to convert to structured format:", error);
      throw new Error(
        `Failed to convert to structured format: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("Step 3: Converting to Arazzo schema...");

    // Convert to full Arazzo schema
    let arazzoWorkflow: Workflow;
    try {
      arazzoWorkflow = convertLLMtoArazzoWorkflow(llmResult);
      console.log("Converted to Arazzo schema:", arazzoWorkflow);
    } catch (error) {
      console.error("Failed to convert to Arazzo schema:", error);
      throw new Error(
        `Failed to convert to Arazzo schema: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log("Step 4: Validating final schema...");

    // Validate and return
    try {
      const validated = workflowSchema.parse(arazzoWorkflow);
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
