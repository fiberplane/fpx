import type { RouteTree } from "../types";

// type SimpleGraphStat = {
//   base: number;
//   total: number
//   references: Array<string>
// }

// // This is a simple/naive implementation of a graph analysis
// export function analyze(treeItems: Array<RouteTree>) {
//   // Where string is the key of the RouteTree and number is the nr of references
//   const complexityMap = new Map<string, SimpleGraphStat>();
//   for (const item of treeItems) {
//     const base = item.entries.length;
//     const references: Array<string> = [];
//     for (const entry of item.entries) {
//       if (entry.type === "ROUTE_TREE_REFERENCE") {
//         references.push(entry.targetId);
//       }
//     }
//     complexityMap.set(item.id, { base, total: base, references });
//   }

//   // Add references

// }

// interface RouteTree {
//   id: string;
//   entries: Array<RouteEntry>;
// }

// interface RouteEntry {
//   type: string;
//   targetId?: string;
// }

interface SimpleGraphStat {
  base: number;
  total: number;
  references: Array<string>;
}

export function analyze(treeItems: Array<RouteTree>): RouteTree | null {
  const complexityMap = new Map<string, SimpleGraphStat>();

  // Step 1: Initialize complexity map with base values
  for (const item of treeItems) {
    const base = item.entries.length;
    const references: Array<string> = [];
    for (const entry of item.entries) {
      if (entry.type === "ROUTE_TREE_REFERENCE" && entry.targetId) {
        references.push(entry.targetId);
      }
    }
    complexityMap.set(item.id, { base, total: base, references });
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

    let totalComplexity = stat.base;
    for (const refId of stat.references) {
      totalComplexity += resolveReferences(refId, visited);
    }

    stat.total = totalComplexity;
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
    if (stat && stat.total > maxComplexity) {
      maxComplexity = stat.total;
      mostComplexItem = item;
    }
  }

  const keys = complexityMap.keys();
  // console.log('complexityMap', complexityMap.keys());
  const totalMap: Record<string, number> = {};
  for (const key of keys) {
    const stat = complexityMap.get(key);
    if (stat) {
      totalMap[key] = stat.total;
    }
  }
  console.log("totalMap", totalMap);
  return mostComplexItem;
}

// // Example usage
// const treeItems: Array<RouteTree> = [
//   {
//     id: "1",
//     entries: [
//       { type: "ROUTE_ENTRY" },
//       { type: "ROUTE_TREE_REFERENCE", targetId: "2" },
//     ],
//   },
//   {
//     id: "2",
//     entries: [
//       { type: "ROUTE_ENTRY" },
//       { type: "ROUTE_ENTRY" },
//       { type: "ROUTE_TREE_REFERENCE", targetId: "3" },
//     ],
//   },
//   {
//     id: "3",
//     entries: [{ type: "ROUTE_ENTRY" }],
//   },
// ];

// const mostComplexItem = analyze(treeItems);
// console.log("Most complex RouteTree item:", mostComplexItem);
