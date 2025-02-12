import { type MetadataFilter, MetadataMode } from "llamaindex";
import { STORAGE_DIR } from "../rag/constants";
import { loadVectorIndex } from "../rag/shared";

/**
 * 
 * @param query 
export declare enum FilterOperator {
    EQ = "==",// default operator (string, number)
    IN = "in",// In array (string or number)
    GT = ">",// greater than (number)
    LT = "<",// less than (number)
    NE = "!=",// not equal to (string, number)
    GTE = ">=",// greater than or equal to (number)
    LTE = "<=",// less than or equal to (number)
    NIN = "nin",// Not in array (string or number)
    ANY = "any",// Contains any (array of strings)
    ALL = "all",// Contains all (array of strings)
    TEXT_MATCH = "text_match",// full text match (allows you to search for a specific substring, token or phrase within the text field)
    CONTAINS = "contains",// metadata array contains value (string or number)
    IS_EMPTY = "is_empty"
}
 */
export async function getDocumentation(query: string, bindings: string[]) {
  const results: Array<{
    binding: string;
    docs: Array<{
      score: number;
      content: string;
    }>;
  }> = [];
  // TODO - Parallelize this
  for (const binding of bindings) {
    const bindingName = mapBinding(binding);
    const bindingFilter: MetadataFilter[] = bindingName
      ? [{ key: "tag", value: bindingName, operator: "==" }]
      : [];
    // Load the vector index from storage here
    // If you haven't created an index yet, you gotta do that first!
    const vectorIndex = await loadVectorIndex(STORAGE_DIR);
    const retriever = vectorIndex.asRetriever({
      similarityTopK: 3,
      filters: {
        filters: [
          { key: "vendor", value: "cloudflare", operator: "==" },
          ...bindingFilter,
        ],
      },
    });

    const nodesWithScore = await retriever.retrieve({ query });

    // NOTE - Only take the top result for now
    // TODO - Record all results for review
    if (nodesWithScore.length > 0) {
      results.push({
        binding,
        docs: nodesWithScore.map((node) => ({
          score: node.score ?? Number.NaN,
          content: node.node.getContent(MetadataMode.NONE),
        })),
      });
    }
  }

  return {
    results,
    content: results
      .map((result) => docsToString(result.binding, result.docs))
      .join("\n\n"),
  };
}

function docsToString(
  binding: string,
  docs: Array<{
    score: number;
    content: string;
  }>,
) {
  return docs
    .map((doc) =>
      `
  <${binding}>
    <section>
      ${doc.content}
    </section>
  </${binding}>
`.trim(),
    )
    .join("\n");
}

// TODO - Create constants for these values
function mapBinding(binding: string) {
  switch (binding?.toLowerCase()) {
    case "r2":
      return "r2";
    case "d1":
      return "d1";
    case "ai":
      return "ai";
    case "kv":
      return "kv";
    case "durable objects":
      return "durable-objects";
    default:
      return null;
  }
}
