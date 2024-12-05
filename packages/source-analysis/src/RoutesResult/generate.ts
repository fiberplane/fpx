import type { ResourceManager } from "../ResourceManager";
import { logger } from "../logger";
import type {
  LocalFileResourceId,
  MiddlewareEntry,
  ModuleReferenceId,
  RouteEntry,
  RouteTree,
} from "../types";
import type { HistoryId } from "./RoutesResult";

type FileInfo = {
  modules: Map<string, Array<string>>;
  sections: Map<number, string>;
};

type Context = {
  resourceManager: ResourceManager;
  visited: Set<LocalFileResourceId>;
  fileMap: Record<string, FileInfo>;
  includeIds: boolean;
};

/**
 * Create an empty file info object
 */
function createFileInfo(): FileInfo {
  return {
    modules: new Map<string, Array<string>>(),
    sections: new Map<number, string>(),
  };
}

function addModules({
  file,
  moduleIds,
  resourceManager,
}: {
  file: FileInfo;
  moduleIds: Set<ModuleReferenceId>;
  resourceManager: ResourceManager;
}) {
  for (const moduleId of moduleIds) {
    const module = resourceManager.getResource(moduleId);
    if (!module) {
      logger.warn("Module not found", moduleId, "module", module);
      continue;
    }

    if (!file.modules.has(module.importPath)) {
      file.modules.set(module.importPath, []);
    }

    const modules = file.modules.get(module.importPath);
    if (!modules) {
      // Given the logic above the modules should always be set
      throw new Error("The modules array is empty");
    }

    modules.push(module.import);
  }
}

export function generate(
  resourceManager: ResourceManager,
  history: Array<HistoryId>,
  includeIds = false,
): string {
  const fileMap: Record<string, FileInfo> = {};
  const visited = new Set<LocalFileResourceId>();

  const context: Context = {
    resourceManager,
    visited,
    fileMap,
    includeIds,
  };

  let name = "";
  for (const id of history) {
    const newName = visitResource(id, name, context);
    if (newName) {
      name = newName;
    }
  }

  const files: Record<string, string> = {};
  for (const [fileName, fileInfo] of Object.entries(fileMap)) {
    files[fileName] = serializeFileMap(fileInfo);
  }

  return Object.entries(files)
    .map(([fileName, content]) => {
      return `/* ${decodeURIComponent(fileName)} */
${content}
/* EOF: ${decodeURIComponent(fileName)} */`;
    })
    .join("\n");
}

function visitResource(
  id: LocalFileResourceId,
  appName: string,
  context: Context,
): string | undefined {
  const { resourceManager, fileMap, includeIds, visited } = context;
  // If the resource has already been visited, skip it
  if (visited.has(id)) {
    return;
  }

  const resource = resourceManager.getResource(id);
  if (!resource) {
    logger.warn("Resource not found", id);
    return;
  }

  visited.add(id);
  if (!fileMap[resource.fileName]) {
    fileMap[resource.fileName] = createFileInfo();
  }

  const currentFile = fileMap[resource.fileName];
  if (!currentFile) {
    throw new Error("Current file is not set");
  }
  const resourceType = resource.type;
  switch (resourceType) {
    case "ROUTE_TREE": {
      const content = extractRouteTreeContent(includeIds, resource);

      currentFile.sections.set(resource.position, content);

      return resource.name;
    }
    case "MIDDLEWARE_ENTRY": {
      if (!appName) {
        logger.warn("Middleware entry outside of route tree");
        break;
      }

      const content = generateMiddlewareEntry(
        resource,
        appName,
        currentFile,
        context,
      );

      currentFile.sections.set(resource.position, content);
      break;
    }
    case "ROUTE_ENTRY": {
      if (!appName) {
        logger.warn("Route entry outside of route tree");
        break;
      }

      const content = generateRouteEntry(
        resource,
        appName,
        currentFile,
        context,
      );
      currentFile.sections.set(resource.position, content);
      break;
    }
    case "ROUTE_TREE_REFERENCE": {
      const target = resourceManager.getResource(resource.targetId);
      if (!target) {
        logger.warn("Target not found", resource.targetId);
        break;
      }

      currentFile.sections.set(
        resource.position,
        `${includeIds ? `// id:${resource.id}` : ""}
${appName}.route("${resource.path}", ${target.name});`,
      );

      break;
    }
    case "SOURCE_REFERENCE": {
      currentFile.sections.set(
        resource.position,
        `${includeIds ? `// id:${resource.id}` : ""}
${resource.content}`,
      );
      addModules({
        file: currentFile,
        moduleIds: resource.modules,
        resourceManager,
      });

      for (const child of resource.references) {
        visitResource(child, appName, context);
      }
      break;
    }
    default: {
      // If there's an error directly below:
      // the switch statement isn't covering all cases
      const exhaustiveCheck: never = resourceType;
      throw new Error(`Unsupported entry type: ${exhaustiveCheck}` as never);
    }
  }
}

function generateRouteEntry(
  resource: RouteEntry,
  appName: string,
  currentFile: FileInfo,
  context: Context,
) {
  const { includeIds, resourceManager } = context;
  let entry = `${includeIds ? `// id:${resource.id}` : ""}
${appName}.${resource.method ?? "all"}("${resource.path}", `;
  for (const sourceId of resource.sources) {
    const source = resourceManager.getResource(sourceId);
    if (!source) {
      logger.warn("Source not found", sourceId);
      continue;
    }

    addModules({
      file: currentFile,
      moduleIds: source.modules,
      resourceManager,
    });

    for (const child of source.references) {
      visitResource(child, appName, context);
    }

    entry += source.content;
  }
  return entry;
}

function generateMiddlewareEntry(
  resource: MiddlewareEntry,
  appName: string,
  currentFile: FileInfo,
  context: Context,
) {
  const { includeIds, resourceManager } = context;
  let middleware = `${includeIds ? `// id:${resource.id}` : ""}\n`;
  if (resource.path) {
    middleware += `${appName}.use("${resource.path}", `;
  } else {
    middleware += `${appName}.use(`;
  }

  const middlewareFunctions = Array.from(resource.sources)
    .map((referenceId) => {
      const source = resourceManager.getResource(referenceId);
      if (!source) {
        logger.warn("Source not found", referenceId);
        return;
      }

      // Inject modules
      addModules({
        file: currentFile,
        moduleIds: source.modules,
        resourceManager,
      });

      for (const child of source.references) {
        visitResource(child, appName, context);
      }

      return source.content;
    })
    .filter(Boolean) as Array<string>;
  middleware += middlewareFunctions.join(", ");
  middleware += ");";
  return middleware;
}

function extractRouteTreeContent(includeIds: boolean, resource: RouteTree) {
  let content = `${
    includeIds
      ? `// id:${resource.id}
`
      : ""
  }const ${resource.name} = new ${resource.library === "hono" ? "Hono" : "OpenAPIHono"}();`;
  if (resource.baseUrl) {
    content += `\n${resource.name}.baseUrl = "${resource.baseUrl}";`;
  }
  return content;
}

function serializeFileMap(fileInfo: FileInfo): string {
  const imports = Array.from(fileInfo.modules.entries())
    .map(([importPath, modules]) => {
      const asteriskModules = modules.filter((module) =>
        module.trim().startsWith("*"),
      );
      const nonAsteriskModules = modules.filter(
        (module) => !module.trim().startsWith("*"),
      );

      let returnValue = asteriskModules
        .map((module) => {
          return `import ${module} from "${importPath}";`;
        })
        .join("\n");

      if (nonAsteriskModules.length) {
        if (returnValue) {
          returnValue += "\n";
        }
        returnValue += `import { ${nonAsteriskModules.join(",")} } from "${importPath}";`;
      }

      return returnValue;
    })
    .join("\n");

  const keys = Array.from(fileInfo.sections.keys()).sort((a, b) => {
    if (a > b) {
      return 1;
    }

    if (a < b) {
      return -1;
    }

    return 0;
  });

  let sections = "";
  for (const key of keys) {
    if (sections.length > 0) {
      sections += "\n";
    }

    sections += fileInfo.sections.get(key) ?? "";
  }

  return imports ? `${imports}\n${sections}` : sections;
}
