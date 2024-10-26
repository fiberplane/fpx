import fs from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Document,
  IngestionPipeline,
  type VectorStoreIndex,
} from "llamaindex";
import { STORAGE_DIR } from "./constants";
import {
  createVectorIndex,
  filterJsonFiles,
  filterMdxFiles,
  loadDocuments,
  queryStore,
} from "./shared";
import { CloudflareMetadataAdder } from "./transformations";

// Create __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cloudflareDocsDir = resolve(
  `${__dirname}/../../../cv-codegen-hackathon/cloudflare-docs`,
);

// Array of directories to load documents from
const docsDirectories = [
  {
    path: `${cloudflareDocsDir}/src/content/workers-ai-models`,
    filter: filterJsonFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "ai" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/durable-objects`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "durable-objects" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/d1`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "d1" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/kv`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "kv" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/r2`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "r2" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/workers-ai`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "ai" }),
  },
  {
    path: `${cloudflareDocsDir}/src/content/docs/ai-gateway`,
    filter: filterMdxFiles,
    metadataFilter: new CloudflareMetadataAdder({ tag: "ai-gateway" }),
  },
];

export async function createCloudflareVectorIndex() {
  if (!fs.existsSync(cloudflareDocsDir)) {
    throw new Error(
      `Cloudflare docs directory does not exist: ${cloudflareDocsDir}`,
    );
  }

  const documents: Document[] = [];
  for (const dir of docsDirectories) {
    const dirPath = dir.path;
    console.log(`Loading documents from ${dirPath}`);
    if (fs.existsSync(dirPath)) {
      const docs = await loadDocuments(dirPath, dir.filter);
      const pipeline = new IngestionPipeline({
        transformations: [dir.metadataFilter],
      });
      console.log(`Loaded ${docs.length} documents from ${dirPath}`);
      // NOTE - Modifies doc nodes in place... I hope this works
      await pipeline.run({ documents: docs });
      console.log("Transformed documents!");
      documents.push(...docs);
    } else {
      console.log(`Directory ${dirPath} does not exist`);
    }
  }

  const vectorIndex = await createVectorIndex(documents, STORAGE_DIR);
  return vectorIndex;
}

export async function testCloudflare(vectorIndex?: VectorStoreIndex) {
  const cloudflareVectorIndex =
    vectorIndex || (await createCloudflareVectorIndex());
  const testQuery = "How can I initialize a Durable Object in my Worker?";
  await queryStore(cloudflareVectorIndex, testQuery);
}
