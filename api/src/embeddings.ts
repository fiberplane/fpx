import { pipeline, env, AllTasks } from "@xenova/transformers";
import { Issues } from "./types";
import { create, insert, insertMultiple } from "@orama/orama";
import {
  persistToFile,
  restoreFromFile,
} from "@orama/plugin-data-persistence/server";
import fs from "fs";
import { assert } from "./utils";
import { EMBEDDINGS_DB_PATH } from "./constants";
import { getGithubIssues } from "./github-service";
import { getProjectDependencies } from "./dependencies";

type Embedder = AllTasks["feature-extraction"];
let embedder: Embedder;

export async function initializeEmbeddingsDB() {
  try {
		console.log("Initializing embeddings DB");
    const embedddingsDb = await restoreFromFile("binary", EMBEDDINGS_DB_PATH);
    console.log("Embeddings db loaded from file", EMBEDDINGS_DB_PATH);
    return embedddingsDb;
  } catch (e) {
    assert(
      e,
      (e): e is Error => e instanceof Error,
      `${e} is not instance of Error`,
    );

    if ("code" in e && e.code === "ENOENT") {
      // if we failed to just load a premade db we create one
      // NOTE: this is gonna take a minute...

      const token = process.env.GITHUB_TOKEN;
      assert(token, "Missing GITHUB_TOKEN");

      console.log("Fetching deps and their issues");
      const deps = getProjectDependencies();
      const issues = await Promise.all(
        deps.map(async (dep) => {
          return await getGithubIssues(
            token,
            dep.repository.owner,
            dep.repository.repo,
          );
        }),
      ).then((issueArrays) => issueArrays.flat());

      console.log("Loading embeddings, this might take a while...");
      const embeddings = await loadEmbeddings(issues);
      console.log(embeddings.length, "embeddings loaded");

      const embeddingsDb = await create({
        schema: {
          id: "number",
          title: "string",
          url: "string",
          body: "string",
          embedding: "vector[384]",
        },
      });

      await insertMultiple(embeddingsDb, embeddings);

      console.log("Embeddings db created and populated");

      await persistToFile(embeddingsDb, "binary", EMBEDDINGS_DB_PATH);
      console.log("Embeddings db persisted to file", EMBEDDINGS_DB_PATH);
      return embeddingsDb;
    }
		console.error("Initialization failed:", e);
  }
}

export async function getEmbedder() {
  if (embedder) {
    return embedder;
  }

  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  return embedder;
}

export async function loadEmbeddings(issues: Issues) {
  const embedder = await getEmbedder();
  const embeddings = [];

  for (const issue of issues) {
    const em = (
      await embedder(issue.title + ": " + issue.body, {
        pooling: "mean",
        normalize: true,
      })
    )
      .tolist()
      .flat();
    embeddings.push({
      embedding: em,
      title: issue.title,
      url: issue.html_url || "", // this might be null so we don't wanna crash the db
      body: issue.body || "",
      issueId: issue.id,
    });
  }

  return embeddings;
}

//
// const ISSUE_EMBEDDINGS = "issue_embeddings";
//
// export async function initializeEmbeddingsDB() {
//   const qdrantClient = new QdrantClient({ url: "http://localhost:6333" });
//
//   // skip the db initialization if the schema already exists
//   if ((await qdrantClient.collectionExists(ISSUE_EMBEDDINGS)).exists) {
//     console.log("Collection already exists");
//     return qdrantClient;
//   }
//
//   await qdrantClient.createCollection(ISSUE_EMBEDDINGS, {
//     vectors: {
//       size: 384,
//       distance: "Cosine",
//     },
//     optimizers_config: {
//       default_segment_number: 2,
//     },
//     replication_factor: 2,
//   });
//
//   await qdrantClient.createPayloadIndex(ISSUE_EMBEDDINGS, {
//     field_name: "title",
//     field_schema: "text",
//     wait: true,
//   });
//
//   await qdrantClient.createPayloadIndex(ISSUE_EMBEDDINGS, {
//     field_name: "body",
//     field_schema: "text",
//     wait: true,
//   });
//
//   return qdrantClient;
// }
//
