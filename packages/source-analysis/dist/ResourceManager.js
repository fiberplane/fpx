import path from "node:path";
// Class that manages tree resources
export class ResourceManager {
    references;
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.references = new Map();
    }
    asRelativePath(absolutePath) {
        return path.isAbsolute(absolutePath)
            ? path.relative(this.projectRoot, absolutePath)
            : absolutePath;
    }
    asAbsolutePath(relativePath) {
        return path.isAbsolute(relativePath)
            ? relativePath
            : path.join(this.projectRoot, relativePath);
    }
    // Implementation of getId function
    getId(resourceType, param1, param2) {
        if (resourceType === "MODULE_REFERENCE") {
            const importPath = encodeURIComponent(param1);
            const importName = encodeURIComponent(param2);
            return `${resourceType}:${importPath}@${importName}`;
        }
        const fileName = encodeURIComponent(this.asRelativePath(param1));
        const position = param2;
        return `${resourceType}:${fileName}@${position}`;
    }
    decodeId(id) {
        const parts = id.split(":");
        const type = parts[0];
        const [fileName, position] = parts[1].split("@");
        return {
            type,
            fileName: this.asAbsolutePath(decodeURIComponent(fileName)),
            position: Number(position),
        };
    }
    createRouteTree(props) {
        const fileName = this.asRelativePath(props.fileName);
        const id = this.getId(props.type, fileName, props.position);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props, fileName };
        this.references.set(id, resource);
        return resource;
    }
    createRouteEntry(props) {
        const fileName = this.asRelativePath(props.fileName);
        const id = this.getId(props.type, fileName, props.position);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props, fileName };
        this.references.set(id, resource);
        return resource;
    }
    addResource(resource) {
        this.references.set(resource.id, resource);
    }
    createMiddlewareEntry(props) {
        const fileName = this.asRelativePath(props.fileName);
        const id = this.getId(props.type, fileName, props.position);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props, fileName };
        this.references.set(id, resource);
        return resource;
    }
    createSourceReference(props) {
        const fileName = this.asRelativePath(props.fileName);
        const id = this.getId(props.type, fileName, props.position);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props, fileName };
        this.references.set(id, resource);
        return resource;
    }
    createModuleReference(props) {
        const id = this.getId(props.type, props.importPath, props.import);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props };
        this.references.set(id, resource);
        console.log("created module", resource.id);
        return resource;
    }
    createRouteTreeReference(props) {
        const fileName = this.asRelativePath(props.fileName);
        const id = this.getId(props.type, fileName, props.position);
        if (this.references.has(id)) {
            console.log("Warning resource already exists", id);
        }
        const resource = { id, ...props, fileName };
        this.references.set(id, resource);
        return resource;
    }
    // Actual implementation
    getResource(id) {
        return this.references.get(id);
    }
    removeResource(id) {
        this.references.delete(id);
    }
    addModuleToSourceReference(fileName, position, module) {
        const id = this.getId("SOURCE_REFERENCE", fileName, position);
        const sourceReference = this.getResource(id);
        if (!this.references.has(module.id)) {
            this.addResource(module);
        }
        if (!sourceReference) {
            console.log(`Missing SourceReference for (fileName: ${fileName}, position: ${position}, id: ${id}`);
            throw new Error("Missing source reference. Attempting to add a module to a non-existing reference");
        }
        sourceReference.modules.push(module.id);
    }
    clearResources() {
        this.references.clear();
    }
    getResources() {
        return Object.fromEntries(this.references);
    }
}
