// This is just a quick smoke test to see if the embeddings have actually been created
// and if they are retrievable

import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { search } from "@orama/orama";
import { Endpoints } from "@octokit/types";
import * as fs from "node:fs";
import {
  FeatureExtractionPipelineOptions,
  pipeline,
} from "@xenova/transformers";
import { optionsMiniLmEmbedder } from "./minilm-embeddings.js";

type GithubIssue =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][number];

const miniLmEmbedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

const db = await restoreFromFile("binary", "minilm-embeddings.msp");

const issuesHonoJSMiddleware: GithubIssue[] = JSON.parse(
  fs.readFileSync("issues/honojs-middleware.json", "utf8").toString(),
);

const random5Indexes = [4, 25, 52, 100, 120];

for (const index of random5Indexes) {
  const issue = issuesHonoJSMiddleware[index];
  const embedding = (await miniLmEmbedder(issue.body, optionsMiniLmEmbedder))
    .tolist()
    .flat();
  const similarIssues = await search(db, {
    mode: "vector",
    vector: {
      value: embedding,
      property: "vector",
    },
  });
  console.log(`Similar issues for issue ${issue.title}:`);
  console.log(similarIssues);
}
