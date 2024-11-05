import path from "node:path";
import { Hono } from "hono";
export class AppFactory {
    resourceManager;
    apps = new Map();
    history;
    constructor(resourceManager) {
        this.resourceManager = resourceManager;
        this.history = [];
    }
    resetHistory() {
        this.history = [];
    }
    hasVisited(id) {
        return this.history.includes(id);
    }
    getHistory() {
        return this.history;
    }
    getHistoryLength() {
        return this.history.length;
    }
    getApp(entryId) {
        const root = this.resourceManager.getResource(entryId);
        this.resetHistory();
        if (!root) {
            throw new Error("Could not find root tree");
        }
        return this.createApp(root);
    }
    createApp(tree) {
        const app = new Hono();
        this.apps.set(tree.id, app);
        app.use((c, next) => {
            this.history.push(tree.id);
            return next();
        });
        for (const entry of tree.entries) {
            const resource = this.resourceManager.getResource(entry);
            if (!resource) {
                console.warn("Resource not found", entry);
                continue;
            }
            switch (resource.type) {
                case "ROUTE_ENTRY": {
                    app.get(resource.path, (c) => {
                        this.history.push(resource.id);
                        return c.text("Ok");
                    });
                    continue;
                }
                case "ROUTE_TREE_REFERENCE": {
                    let targetApp = this.apps.get(resource.targetId);
                    if (targetApp) {
                        app.route(resource.path, targetApp);
                    }
                    else {
                        const tree = this.resourceManager.getResource(resource.targetId);
                        if (!tree) {
                            console.warn("Referring resource not found", resource.targetId);
                            continue;
                        }
                        targetApp = this.createApp(tree);
                        if (targetApp) {
                            app.route(resource.path, targetApp);
                        }
                    }
                    continue;
                }
                case "MIDDLEWARE_ENTRY": {
                    const middlewareFunc = async (_, next) => {
                        this.history.push(resource.id);
                        await next();
                    };
                    if (resource.path) {
                        app.use(resource.path, middlewareFunc);
                    }
                    else {
                        app.use(middlewareFunc);
                    }
                    continue;
                }
                default: {
                    // Typescript should never happen
                    throw new Error(`Unsupported entry type: ${entry}`);
                }
            }
        }
        return app;
    }
    getFilesForHistory() {
        const fileMap = {};
        const visited = new Set();
        const self = this;
        function createFileInfo() {
            return {
                modules: {},
                sections: {},
            };
        }
        function addModules(file, moduleIds) {
            for (const moduleId of moduleIds) {
                const module = self.resourceManager.getResource(moduleId);
                if (!module) {
                    console.warn("Module not found", moduleId, "module", module);
                    continue;
                }
                if (!file.modules[module.importPath]) {
                    file.modules[module.importPath] = [];
                }
                file.modules[module.importPath].push(module.import);
            }
        }
        function visit(id, appName) {
            if (visited.has(id)) {
                return;
            }
            const resource = self.resourceManager.getResource(id);
            if (!resource) {
                console.warn("Resource not found", id);
                return;
            }
            visited.add(id);
            if (!fileMap[resource.fileName]) {
                fileMap[resource.fileName] = createFileInfo();
            }
            const currentFile = fileMap[resource.fileName];
            const resourceType = resource.type;
            switch (resourceType) {
                case "ROUTE_TREE": {
                    currentFile.sections[resource.position] = `const ${resource.name} = new Hono();
${resource.name}.baseUrl = "${resource.baseUrl}";
          `;
                    return resource.name;
                }
                case "MIDDLEWARE_ENTRY": {
                    if (!appName) {
                        console.warn("Middleware entry outside of route tree");
                        break;
                    }
                    let middleware = `// Middleware entry:${resource.id}\n`;
                    if (resource.path) {
                        middleware += `${appName}.use("${resource.path}", `;
                    }
                    else {
                        middleware += `${appName}.use(`;
                    }
                    const middlewareFunctions = resource.sources
                        .map((referenceId) => {
                        const source = self.resourceManager.getResource(referenceId);
                        if (!source) {
                            console.warn("Source not found", referenceId);
                            return;
                        }
                        // Inject modules
                        addModules(currentFile, source.modules);
                        for (const child of source.references) {
                            visit(child, appName);
                        }
                        return source.content;
                    })
                        .filter(Boolean);
                    middleware += middlewareFunctions.join(", ");
                    middleware += ");";
                    currentFile.sections[resource.position] = middleware;
                    break;
                }
                case "ROUTE_ENTRY": {
                    if (!appName) {
                        console.warn("Route entry outside of route tree");
                        break;
                    }
                    let entry = `// Route entry:${resource.id}
${appName}.${resource.method}("${resource.path}", `;
                    for (const sourceId of resource.sources) {
                        const source = self.resourceManager.getResource(sourceId);
                        if (!source) {
                            console.warn("Source not found", sourceId);
                            continue;
                        }
                        addModules(currentFile, source.modules);
                        for (const child of source.references) {
                            visit(child, appName);
                        }
                        entry += source.content;
                    }
                    currentFile.sections[resource.position] = entry;
                    break;
                }
                case "ROUTE_TREE_REFERENCE": {
                    const target = self.resourceManager.getResource(resource.targetId);
                    if (!target) {
                        console.warn("Target not found", resource.targetId);
                        break;
                    }
                    currentFile.sections[resource.position] =
                        `// Route tree reference:${resource.id}
${appName}.route("${resource.path}", ${target.name});`;
                    // Is this something that should be imported?
                    if (target.fileName !== resource.fileName) {
                        const importPath = path.relative(resource.fileName, target.fileName);
                        currentFile.modules[importPath] = [target.name];
                    }
                    break;
                }
                case "SOURCE_REFERENCE": {
                    currentFile.sections[resource.position] =
                        `// Source reference:${resource.id}
${resource.content}`;
                    addModules(currentFile, resource.modules);
                    for (const child of resource.references) {
                        visit(child, appName);
                    }
                    break;
                }
                default: {
                    // If there's an error directly below:
                    // the switch statement isn't covering all cases
                    const _exhaustiveCheck = resourceType;
                    throw new Error(`Unsupported entry type: ${resourceType}`);
                }
            }
        }
        let name = "";
        for (const id of this.history) {
            const newName = visit(id, name);
            if (newName) {
                name = newName;
            }
        }
        const files = {};
        for (const [fileName, fileInfo] of Object.entries(fileMap)) {
            const imports = Object.entries(fileInfo.modules)
                .map(([importPath, modules]) => {
                return `import { ${modules.join(", ")} } from "${importPath}";`;
            })
                .join("\n");
            const sections = Object.entries(fileInfo.sections)
                .sort(([a], [b]) => {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            })
                .map(([_, content]) => {
                return content;
            })
                .join("\n");
            files[fileName] = imports ? `${imports}\n\n${sections}` : sections;
        }
        return Object.entries(files)
            .map(([fileName, content]) => {
            return `//@ Start file: ${decodeURIComponent(fileName)}
${content}
//@ EOF file: ${decodeURIComponent(fileName)}
`;
        })
            .join("\n\n");
    }
}
