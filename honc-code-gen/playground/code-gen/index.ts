import * as readline from "node:readline/promises";
import dotenv from "dotenv";
import { generateApiRoutes } from "../../src/v1/code-gen/api-routes";
import { getActiveModel } from "../../src/v1/code-gen/models";
import { generatePlan } from "../../src/v1/code-gen/planner";
import { generateSchema } from "../../src/v1/code-gen/schema";
import { generateSeed } from "../../src/v1/code-gen/seed";
import { generateWranglerConfig } from "../../src/v1/code-gen/wrangler";
import { addCloudflareBindings } from "./cloudflare-bindings";
import {
  getCurrentTraceId,
  initializeTraceId,
  saveOutput,
} from "./utils/output-manager";
import { visualizeTrace } from "./utils/visualize-trace";

dotenv.config({
  path: ".dev.vars",
});

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

generateApi(apiKey).catch(console.error);

export async function generateApi(apiKey: string) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const aiProvider = getActiveModel(apiKey);

  // Initialize an object to track timing data of each step
  const timings: { [key: string]: number } = {};

  // Get user's idea
  const idea = await terminal.question("What is your idea for an api?");

  console.log("Planning your api... This may take a few seconds!");

  // Create plan for the api
  const startTime = Date.now();
  const planStartTime = Date.now();
  const plan = await generatePlan(aiProvider, idea);
  timings.generatePlan = Date.now() - planStartTime;

  const traceId = initializeTraceId(plan.appName);
  console.log(`Starting new run with trace ID: ${traceId}`);

  await saveOutput("00-initial-idea", idea);

  await saveOutput("01-initial-plan-reasoning.txt", plan.reasoning);
  await saveOutput("01-initial-plan", plan);

  // Generate database schema
  // This is a necessary first step for generation the seed file and implementing the api routes
  const schemaStartTime = Date.now();
  const dbSchema = await generateSchema(aiProvider, plan.databaseSchema);
  timings.generateSchema = Date.now() - schemaStartTime;

  await saveOutput("02-db-schema-reasoning.txt", dbSchema.reasoning);
  await saveOutput("02-db-schema.ts", dbSchema.dbSchemaTs);

  // TODO
  // - [optional] Determine Packages
  //   * Resolve the package names
  //   * Use latest versions
  //   * Modify package.json
  //   * Import the packages in index.ts
  //   * (Add install instructions for end user?)

  // Generate wrangler config and seed file
  //
  // NOTE: These are parallel to reduce overall latency
  const seedStartTime = Date.now();
  const wranglerStartTime = Date.now();
  await Promise.all([
    // TODO - We can actually do this without an LLM
    generateWranglerConfig(
      aiProvider,
      plan?.cloudflareBindings?.bindings ?? [],
    ).then(async (wranglerConfig) => {
      timings.generateWranglerConfig = Date.now() - wranglerStartTime;
      try {
        await saveOutput("03-wrangler-reasoning.txt", wranglerConfig.reasoning);
        await saveOutput("03-wrangler.toml", wranglerConfig.wranglerToml);
      } catch (error) {
        console.error("Error saving wrangler config:", error);
      }
      return wranglerConfig;
    }),
    generateSeed(aiProvider, {
      dbSchema: dbSchema.dbSchemaTs,
    }).then(async (seedFile) => {
      timings.generateSeed = Date.now() - seedStartTime;
      try {
        await saveOutput("03-seed-reasoning.txt", seedFile.reasoning);
        await saveOutput("03-seed.ts", seedFile.seedTs);
      } catch (error) {
        console.error("Error saving seed file:", error);
      }
      return seedFile;
    }),
  ]);

  // Generate API routes
  const apiRoutesStartTime = Date.now();
  const apiRoutes = await generateApiRoutes(aiProvider, {
    dbSchema: dbSchema.dbSchemaTs,
    apiPlan: plan.apiRoutes,
  });
  timings.generateApiRoutes = Date.now() - apiRoutesStartTime;
  await saveOutput("04-api-routes-reasoning.txt", apiRoutes.reasoning);
  await saveOutput("04-api-routes.ts", apiRoutes.indexTs);

  // Add Cloudflare bindings
  if (plan.cloudflareBindings?.bindings.length) {
    const cloudflareBindingsStartTime = Date.now();
    const cloudflareBindings = await addCloudflareBindings(aiProvider, {
      reasoning: plan.cloudflareBindings?.reasoning ?? "",
      bindings: plan.cloudflareBindings?.bindings ?? [],
      apiRoutes: apiRoutes.indexTs,
    });
    timings.addCloudflareBindings = Date.now() - cloudflareBindingsStartTime;

    await saveOutput("05-cf-bindings-prompt.txt", cloudflareBindings.prompt);
    await saveOutput(
      "05-cf-bindings-reasoning.txt",
      cloudflareBindings.reasoning,
    );
    await saveOutput("05-cf-bindings.ts", cloudflareBindings.indexTs);
    await saveOutput(
      "05-cf-bindings-documentation",
      cloudflareBindings.documentation,
    );
    await saveOutput(
      "05-cf-bindings-documentation-content.txt",
      cloudflareBindings.documentation.content,
    );
  }

  const totalTime = Date.now() - startTime;
  timings.total = totalTime;

  await saveOutput("99-timings.json", JSON.stringify(timings, null, 2));

  await visualizeTrace(traceId);

  console.log(`Run completed. Trace ID: ${getCurrentTraceId()}`);
}
