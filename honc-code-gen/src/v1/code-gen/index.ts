import dotenv from "dotenv";
import { generateApiRoutes } from "./api-routes";
// import { addCloudflareBindings } from "./cloudflare-bindings";
import { getActiveModel } from "./models";
import { generatePlan } from "./planner";
import { generateSchema } from "./schema";
import { generateSeed } from "./seed";
import { generateWranglerConfig } from "./wrangler";

dotenv.config();

// TODO - Save intermediary steps to R2, or use a real LLM observability pipeline
const SAVE_OUTPUT_NOOP = async (_path: string, _content: unknown) => {
  // noop
};

function generateTraceId(appName = "app"): string {
  return `${appName}-${crypto.randomUUID()}`;
}

export async function generateApi(
  apiKey: string,
  idea: string,
  saveOutput: (
    path: string,
    content: unknown,
  ) => Promise<void> = SAVE_OUTPUT_NOOP,
) {
  const aiProvider = getActiveModel(apiKey);

  // Initialize an object to track timing data of each step
  const timings: { [key: string]: number } = {};

  console.log("Planning the api... This may take a few seconds!");

  // Create plan for the api
  const startTime = Date.now();
  const planStartTime = Date.now();
  const plan = await generatePlan(aiProvider, idea);
  timings.generatePlan = Date.now() - planStartTime;

  const traceId = generateTraceId(plan.appName);
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
  // - [optional] Determin Packages
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
  const [wranglerConfig, seedFile] = await Promise.all([
    // TODO - We can actually do this without an LLM
    generateWranglerConfig(
      aiProvider,
      plan?.cloudflareBindings?.bindings ?? [],
    ).then(async (wranglerConfigResult) => {
      timings.generateWranglerConfig = Date.now() - wranglerStartTime;
      try {
        await saveOutput(
          "03-wrangler-reasoning.txt",
          wranglerConfigResult.reasoning,
        );
        await saveOutput("03-wrangler.toml", wranglerConfigResult.wranglerToml);
      } catch (error) {
        console.error("Error saving wrangler config:", error);
      }
      return wranglerConfigResult;
    }),
    generateSeed(aiProvider, {
      dbSchema: dbSchema.dbSchemaTs,
    }).then(async (seedFileResult) => {
      timings.generateSeed = Date.now() - seedStartTime;
      try {
        await saveOutput("03-seed-reasoning.txt", seedFileResult.reasoning);
        await saveOutput("03-seed.ts", seedFileResult.seedTs);
      } catch (error) {
        console.error("Error saving seed file:", error);
      }
      return seedFileResult;
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

  // TODO - Add Cloudflare bindings (needs integration with RAG pipeline)
  const cloudflareBindings = { indexTs: null };
  // let cloudflareBindings: null | Awaited<ReturnType<typeof addCloudflareBindings>> = null;
  //
  // if (plan.cloudflareBindings?.bindings.length) {
  // 	const cloudflareBindingsStartTime = Date.now();
  // 	cloudflareBindings = await addCloudflareBindings(aiProvider, {
  // 		reasoning: plan.cloudflareBindings?.reasoning ?? "",
  // 		bindings: plan.cloudflareBindings?.bindings ?? [],
  // 		apiRoutes: apiRoutes.indexTs,
  // 	});
  // 	timings.addCloudflareBindings = Date.now() - cloudflareBindingsStartTime;

  // 	await saveOutput("05-cf-bindings-prompt.txt", cloudflareBindings.prompt);
  // 	await saveOutput(
  // 		"05-cf-bindings-reasoning.txt",
  // 		cloudflareBindings.reasoning,
  // 	);
  // 	await saveOutput("05-cf-bindings.ts", cloudflareBindings.indexTs);
  // 	await saveOutput(
  // 		"05-cf-bindings-documentation",
  // 		cloudflareBindings.documentation,
  // 	);
  // 	await saveOutput(
  // 		"05-cf-bindings-documentation-content.txt",
  // 		cloudflareBindings.documentation.content,
  // 	);
  // }

  const totalTime = Date.now() - startTime;
  timings.total = totalTime;

  await saveOutput("99-timings.json", JSON.stringify(timings, null, 2));

  console.log(`Run completed. Trace ID: ${traceId}`);

  return {
    traceId,
    timings,

    indexTs: cloudflareBindings?.indexTs ?? apiRoutes.indexTs,
    dbSchemaTs: dbSchema.dbSchemaTs,
    seedTs: seedFile?.seedTs ?? null,
    wranglerToml: wranglerConfig?.wranglerToml ?? null,
  };
}
