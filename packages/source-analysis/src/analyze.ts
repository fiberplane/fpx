import { logger } from "./logger";
import type {
  RouteTree,
  RouteTreeId,
  RouteTreeReference,
  TreeResource,
} from "./types";

interface TreeStatistic {
  baseCount: number;
  totalCount: number;
  references: Array<string>;
}

export function analyze(
  resources: Record<string, TreeResource>,
): RouteTree | null {
  const complexityMap = new Map<string, TreeStatistic>();

  // Step 1: Find all tree items and initialize complexity map with base values
  const treeItems: Array<RouteTree> = Object.keys(resources)
    .filter((key) => key.startsWith("ROUTE_TREE:"))
    .map((key) => resources[key] as RouteTree);
  for (const item of treeItems) {
    const base = item.entries.length;
    const references: Array<RouteTreeId> = [];
    for (const entry of item.entries) {
      if (entry.startsWith("ROUTE_TREE_REFERENCE:")) {
        const treeReference = resources[entry];
        if (!treeReference) {
          logger.warn("Resource not found", entry);
          continue;
        }
        references.push((treeReference as RouteTreeReference).targetId);
      }
    }
    complexityMap.set(item.id, {
      baseCount: base,
      totalCount: base,
      references,
    });
  }

  // Step 2: Resolve references and update total complexity
  function resolveReferences(itemId: string, visited: Set<string>): number {
    if (visited.has(itemId)) {
      return 0; // Circular reference detected, return 0 to avoid infinite loop
    }
    visited.add(itemId);

    const stat = complexityMap.get(itemId);
    if (!stat) {
      return 0; // Item not found, return 0
    }

    let totalComplexity = stat.baseCount;
    for (const refId of stat.references) {
      totalComplexity += resolveReferences(refId, visited);
    }

    stat.totalCount = totalComplexity;
    return totalComplexity;
  }

  for (const item of treeItems) {
    resolveReferences(item.id, new Set<string>());
  }

  // Step 3: Find the most complex RouteTree item
  let mostComplexItem: RouteTree | null = null;
  let maxComplexity = 0;

  for (const item of treeItems) {
    const stat = complexityMap.get(item.id);
    if (stat && stat.totalCount > maxComplexity) {
      maxComplexity = stat.totalCount;
      mostComplexItem = item;
    }
  }

  return mostComplexItem;
}
