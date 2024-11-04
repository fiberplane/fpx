import path from "node:path";
import type {
  LocalFileResource,
  LocalFileResourceId,
  MiddlewareEntry,
  MiddlewareEntryId,
  ModuleReference,
  ModuleReferenceId,
  RouteEntry,
  RouteEntryId,
  RouteTree,
  RouteTreeEntry,
  RouteTreeEntryId,
  RouteTreeId,
  RouteTreeReference,
  SourceReference,
  SourceReferenceId,
  TreeResource,
  TreeResourceId,
} from "./types";

// type NotModuleTreeReference = Exclude<TreeResource, ModuleReference>;

// Class that manages tree resources
export class ResourceManager {
  private references: Map<TreeResourceId, TreeResource>;
  private projectRoot: string;
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.references = new Map();
  }

  asRelativePath(absolutePath: string) {
    return path.isAbsolute(absolutePath)
      ? path.relative(this.projectRoot, absolutePath)
      : absolutePath;
  }

  asAbsolutePath(relativePath: string) {
    return path.isAbsolute(relativePath)
      ? relativePath
      : path.join(this.projectRoot, relativePath);
  }

  // Overloads for getId function
  getId(
    resourceType: "ROUTE_TREE",
    fileName: string,
    position: number,
  ): RouteTree["id"];
  getId(
    resourceType: "ROUTE_ENTRY",
    fileName: string,
    position: number,
  ): RouteEntry["id"];
  getId(
    resourceType: "MIDDLEWARE_ENTRY",
    fileName: string,
    position: number,
  ): MiddlewareEntry["id"];
  getId(
    resourceType: "SOURCE_REFERENCE",
    fileName: string,
    position: number,
  ): SourceReference["id"];
  getId(
    resourceType: "MODULE_REFERENCE",
    importPath: string,
    importName: string,
  ): ModuleReference["id"];
  getId(
    resourceType: "ROUTE_TREE_REFERENCE",
    fileName: string,
    position: number,
  ): RouteTreeReference["id"];
  // Implementation of getId function
  getId(
    resourceType: TreeResource["type"],
    param1: string,
    param2: string | number,
  ): TreeResourceId {
    if (resourceType === "MODULE_REFERENCE") {
      const importPath = encodeURIComponent(param1);
      const importName = encodeURIComponent(param2 as string);
      return `${resourceType}:${importPath}@${importName}` as ModuleReference["id"];
    }

    const fileName = encodeURIComponent(this.asRelativePath(param1));
    const position = param2 as number;
    return `${resourceType}:${fileName}@${position}` as TreeResourceId;
  }

  decodeId(id: TreeResourceId) {
    const parts = id.split(":");
    const type = parts[0] as TreeResource["type"];
    const [fileName, position] = parts[1].split("@");
    return {
      type,
      fileName: this.asAbsolutePath(decodeURIComponent(fileName)),
      position: Number(position),
    };
  }

  createRouteTree(props: Omit<RouteTree, "id">): RouteTree {
    const fileName = this.asRelativePath(props.fileName);
    const id = this.getId(props.type, fileName, props.position);

    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }

    const resource = { id, ...props, fileName };
    this.references.set(id, resource);
    return resource;
  }

  createRouteEntry(props: Omit<RouteEntry, "id">): RouteEntry {
    const fileName = this.asRelativePath(props.fileName);
    const id = this.getId(props.type, fileName, props.position);

    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }

    const resource = { id, ...props, fileName };
    this.references.set(id, resource);
    return resource;
  }

  private addResource(resource: TreeResource) {
    this.references.set(resource.id, resource);
  }

  createMiddlewareEntry(props: Omit<MiddlewareEntry, "id">): MiddlewareEntry {
    const fileName = this.asRelativePath(props.fileName);
    const id = this.getId(props.type, fileName, props.position);

    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }

    const resource = { id, ...props, fileName };
    this.references.set(id, resource);
    return resource;
  }

  createSourceReference(props: Omit<SourceReference, "id">): SourceReference {
    const fileName = this.asRelativePath(props.fileName);
    const id = this.getId(props.type, fileName, props.position);

    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }

    const resource = { id, ...props, fileName };
    this.references.set(id, resource);
    return resource;
  }

  createModuleReference(props: Omit<ModuleReference, "id">): ModuleReference {
    const id = this.getId(props.type, props.importPath, props.import);
    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }
    const resource = { id, ...props };
    this.references.set(id, resource);
    console.log("created module", resource.id);
    return resource;
  }

  createRouteTreeReference(
    props: Omit<RouteTreeReference, "id">,
  ): RouteTreeReference {
    const fileName = this.asRelativePath(props.fileName);
    const id = this.getId(props.type, fileName, props.position);

    if (this.references.has(id)) {
      console.log("Warning resource already exists", id);
    }

    const resource = { id, ...props, fileName };
    this.references.set(id, resource);
    return resource;
  }

  // Overloaded getResource function
  getResource(id: RouteTreeId): RouteTree | undefined;
  getResource(id: RouteEntryId): RouteEntry | undefined;
  getResource(id: RouteTreeEntryId): RouteTreeEntry | undefined;
  getResource(id: MiddlewareEntryId): MiddlewareEntry | undefined;
  getResource(id: SourceReferenceId): SourceReference | undefined;
  getResource(id: ModuleReferenceId): ModuleReference | undefined;
  getResource(
    id: RouteTreeEntryId | RouteTreeId,
  ): RouteTreeEntry | RouteTree | undefined;
  getResource(id: LocalFileResourceId): LocalFileResource | undefined;
  // Actual implementation
  getResource(id: TreeResourceId): TreeResource | undefined {
    return this.references.get(id);
  }

  removeResource(id: TreeResourceId) {
    this.references.delete(id);
  }

  addModuleToSourceReference(
    fileName: string,
    position: number,
    module: ModuleReference,
  ): void {
    const id = this.getId("SOURCE_REFERENCE", fileName, position);
    const sourceReference = this.getResource(id) as SourceReference;

    if (!this.references.has(module.id)) {
      this.addResource(module);
    }

    if (!sourceReference) {
      console.log(
        `Missing SourceReference for (fileName: ${fileName}, position: ${position}, id: ${id}`,
      );
      console.log("References", this.references.keys());
      throw new Error(
        "Missing source reference. Attempting to add a module to a non-existing reference",
      );
    }

    sourceReference.modules.push(module.id);
  }

  // addModuleToReference(
  //   fileName: string,
  //   position: number,
  //   module: ModuleReference,
  // ): void {
  //   const sourceReference = this.getReference(fileName, position);
  //   if (!sourceReference) {
  //     console.log(
  //       `Missing SourceReference for (fileName: ${fileName}, position: ${position}`,
  //     );
  //     throw new Error(
  //       "Missing source reference. Attempting to add a module to a non-existing reference",
  //     );
  //   }

  //   if (sourceReference.modules[module.name] === undefined) {
  //     sourceReference.modules[module.name] = [];
  //   }
  //   const moduleImports = sourceReference.modules[module.name];

  //   if (
  //     moduleImports.find(
  //       (item) =>
  //         item.import === module.import &&
  //         item.importPath === module.importPath,
  //     )
  //   ) {
  //     return;
  //   }

  //   moduleImports.push(module);
  // }

  clearResources(): void {
    this.references.clear();
  }

  getResources() {
    return Object.fromEntries(this.references);
  }
}

// function isCreateModelReference(
//   resource: Omit<TreeResource, "id">,
// ): resource is Omit<ModuleReference, "id"> {
//   return resource.type === "MODULE_REFERENCE";
// }

// type CreateOptions = Omit<RouteTree, "id"> |
//   Omit<RouteEntry, "id"> |
//   Omit<MiddlewareEntry, "id"> |
//   Omit<SourceReference, "id"> |
//   Omit<ModuleReference, "id"> |
//   Omit<RouteTreeReference, "id">;
// // type TypeMap = {

// // }
