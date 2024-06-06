import { create, insert, insertMultiple, search } from "@orama/orama";
import {
  pipeline,
  env,
  type FeatureExtractionPipelineOptions,
} from "@xenova/transformers";
import {
  restoreFromFile,
  persistToFile,
} from "@orama/plugin-data-persistence/server";
import * as fs from "node:fs/promises";

const files = [
  "drizzle-team-drizzle-orm.json",
  "drizzle-team-drizzle-kit-mirror.json",
  "honojs-hono.json",
  "honojs-middleware.json",
  "neondatabase-serverless.json",
];

const miniLmEmbedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

export const optionsMiniLmEmbedder: FeatureExtractionPipelineOptions = {
  pooling: "mean",
  normalize: true,
};

const orama = await create({
  schema: {
    title: "string",
    body: "string",
    state: "string",
    labels: "string",
    createdAt: "string",
    updatedAt: "string",
    closedAt: "string",
    vector: "vector[384]",
  },
});

let ALL_ISSUES = [];

async function processIssuesFile(file: string) {
  try {
    console.log(`Processing file ${file}`);
    const fileBuffer = await fs.readFile(`issues/${file}`);
    const fileData = JSON.parse(fileBuffer.toString());
    console.log(`Read ${fileData.length} issues from file ${file}`);
    console.log("Creating embeddings...");
		const issues = await Promise.all(fileData.map(async (issue) => ({
			title: issue.title,
			body: issue.body ?? "",
			state: issue.state,
			createdAt: issue.created_at,
			updatedAt: issue.updated_at,
			closedAt: issue.closed_at ?? "",
			vector: (
				await miniLmEmbedder(
					`${issue.title} ${issue.body}`,
					optionsMiniLmEmbedder,
				)
			)
			.tolist()
			.flat(),
		})));
    console.log(`Created embeddings for ${issues.length} issues`);
    ALL_ISSUES = ALL_ISSUES.concat(issues);
  } catch (error) {
    console.error(`Error processing file ${file}`, error);
    process.exit(1);
  }
}

try {
  console.log("Processing files...");
  await Promise.all(files.map(processIssuesFile));
  console.log("Inserting embeddings...");
  await insertMultiple(orama, ALL_ISSUES);
  console.log(`Inserted embeddings for ${ALL_ISSUES.length} issues`);
  await persistToFile(orama, "binary", "minilm-embeddings.msp");
} catch (error) {
  console.error(error);
  process.exit(1);
}
