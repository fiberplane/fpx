import type { ModuleReference, SourceReference } from "../types";

// Class that manages SourceReferences, Source references are unique to a file & start position
export class SourceReferenceManager {
  private references: Map<string, SourceReference>;

  constructor() {
    this.references = new Map();
  }

  getId(filename: string, position: number) {
    return `${filename}@${position}`;
  }

  addReference(
    fileName: string,
    position: number,
    reference: SourceReference,
  ): void {
    const id = this.getId(fileName, position);
    this.references.set(id, reference);
  }

  getReference(
    fileName: string,
    position: number,
  ): SourceReference | undefined {
    const id = this.getId(fileName, position);
    return this.references.get(id);
  }

  removeReference(fileName: string, position: number): void {
    const id = this.getId(fileName, position);
    this.references.delete(id);
  }

  addModuleToReference(
    fileName: string,
    position: number,
    module: ModuleReference,
  ): void {
    const sourceReference = this.getReference(fileName, position);
    if (!sourceReference) {
      console.log(
        `Missing SourceReference for (fileName: ${fileName}, position: ${position}`,
      );
      throw new Error(
        "Missing source reference. Attempting to add a module to a non-existing reference",
      );
    }

    if (sourceReference.modules[module.name] === undefined) {
      sourceReference.modules[module.name] = [];
    }

    if (sourceReference.modules[module.name].find(item => item.import === module.import && item.importPath === module.importPath)) {
      return;
    }

    sourceReference.modules[module.name].push(module);
  }

  clearReferences(): void {
    this.references.clear();
  }
}
