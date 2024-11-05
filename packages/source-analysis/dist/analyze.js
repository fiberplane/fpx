export function analyze(resources) {
    const complexityMap = new Map();
    // Step 1: Find all tree items and initialize complexity map with base values
    const treeItems = Object.keys(resources)
        .filter((key) => key.startsWith("ROUTE_TREE:"))
        .map((key) => resources[key]);
    for (const item of treeItems) {
        const base = item.entries.length;
        const references = [];
        for (const entry of item.entries) {
            if (entry.startsWith("ROUTE_TREE_REFERENCE:")) {
                const treeReference = resources[entry];
                if (!treeReference) {
                    console.warn("Resource not found", entry);
                    continue;
                }
                references.push(treeReference.targetId);
            }
        }
        complexityMap.set(item.id, {
            baseCount: base,
            totalCount: base,
            references,
        });
    }
    // Step 2: Resolve references and update total complexity
    function resolveReferences(itemId, visited) {
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
        resolveReferences(item.id, new Set());
    }
    // Step 3: Find the most complex RouteTree item
    let mostComplexItem = null;
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
