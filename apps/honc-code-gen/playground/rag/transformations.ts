import {
  type BaseNode,
  MetadataMode,
  TextNode,
  TransformComponent,
  defaultNodeTextTemplate,
} from "llamaindex";

/**
 * @NOTE - I dislike classes that end in "er", but I'm working fast...
 *
 * Abstract class for adding metadata to nodes, based off of llamaindex's BaseExtractor,
 * so definitely can be refactored into something simpler.
 *
 * The logic here is we want to add metadata to the nodes, and then return the nodes
 * - vendor: "cloudflare"
 * - tag: the tag we want to add
 *
 * Source:
 * - https://github.com/run-llama/LlamaIndexTS/blob/ae49ff4e15cc809b0b1fb36309fd73fb0ab612e2/packages/llamaindex/src/extractors/MetadataExtractors.ts#L4
 * - https://github.com/run-llama/LlamaIndexTS/blob/ae49ff4e15cc809b0b1fb36309fd73fb0ab612e2/packages/llamaindex/src/extractors/types.ts
 */
export abstract class BaseMetadataAdder extends TransformComponent {
  isTextNodeOnly = true;
  showProgress = true;
  metadataMode: MetadataMode = MetadataMode.ALL;
  disableTemplateRewrite = false;
  inPlace = true;
  numWorkers = 4;
  metadata: Record<string, string>;

  constructor(metadata: Record<string, string>) {
    super(async (nodes: BaseNode[]): Promise<BaseNode[]> => {
      return this.processNodes(nodes);
    });

    this.metadata = metadata;
  }

  // NOTE - We're not doing any actual extraction here, we're just adding metadata
  //
  // biome-ignore lint/suspicious/noExplicitAny: copying llamaindex code
  abstract extract(nodes: BaseNode[]): Promise<Record<string, any>[]>;

  /**
   *
   * @param nodes Nodes to add metadata to.
   * @returns Nodes with metadata added.
   */
  async processNodes(nodes: BaseNode[]): Promise<BaseNode[]> {
    let newNodes: BaseNode[];

    if (this.inPlace) {
      newNodes = nodes;
    } else {
      newNodes = nodes.slice();
    }

    const curMetadataList = await this.extract(newNodes);

    for (const idx in newNodes) {
      // biome-ignore lint/style/noNonNullAssertion: copying llamaindex code
      newNodes[idx]!.metadata = {
        // biome-ignore lint/style/noNonNullAssertion: copying llamaindex code
        ...newNodes[idx]!.metadata,
        ...curMetadataList[idx],
      };
    }

    for (const idx in newNodes) {
      // No idea what this does
      if (!this.disableTemplateRewrite) {
        if (newNodes[idx] instanceof TextNode) {
          newNodes[idx] = new TextNode({
            ...newNodes[idx],
            textTemplate: defaultNodeTextTemplate.format(),
          });
        }
      }
    }

    return newNodes;
  }
}

type NoMetadata = Record<string, never>;
type CloudflareMetadata = { vendor: "cloudflare" } & Record<string, string>;

export class CloudflareMetadataAdder extends BaseMetadataAdder {
  /**
   *
   * @param node Node to extract keywords from.
   * @returns Keywords extracted from the node.
   */
  async getMetadataForNode(
    node: BaseNode,
  ): Promise<CloudflareMetadata | NoMetadata> {
    if (this.isTextNodeOnly && !(node instanceof TextNode)) {
      return {};
    }

    return {
      vendor: "cloudflare",
      ...this.metadata,
    };
  }

  /**
   *
   * @param nodes Nodes to extract keywords from.
   * @returns Keywords extracted from the nodes.
   */
  async extract(
    nodes: BaseNode[],
  ): Promise<Array<CloudflareMetadata | NoMetadata>> {
    const results = await Promise.all(
      nodes.map((node) => this.getMetadataForNode(node)),
    );
    return results;
  }
}

type DrizzleMetadata = { vendor: "drizzle" } & Record<string, string>;

export class DrizzleMetadataAdder extends BaseMetadataAdder {
  /**
   *
   * @param node Node to extract keywords from.
   * @returns Keywords extracted from the node.
   */
  async getMetadataForNode(
    node: BaseNode,
  ): Promise<DrizzleMetadata | NoMetadata> {
    if (this.isTextNodeOnly && !(node instanceof TextNode)) {
      return {};
    }

    return {
      vendor: "drizzle",
      ...this.metadata,
    };
  }

  /**
   *
   * @param nodes Nodes to extract keywords from.
   * @returns Keywords extracted from the nodes.
   */
  async extract(
    nodes: BaseNode[],
  ): Promise<Array<DrizzleMetadata | NoMetadata>> {
    const results = await Promise.all(
      nodes.map((node) => this.getMetadataForNode(node)),
    );
    return results;
  }
}
