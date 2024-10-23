import type { SourceReference, ModuleReference } from "../types";

// Class that manages SourceReferences, Source references are unique to a file & start position
export class SourceReferenceManager {
  private references: Map<string, SourceReference>;

  constructor() {
    this.references = new Map();
  }

  getId(filename: string, line: number, character: number) {
    return `${filename}:${line}:${character}`;
  }

  addReference(fileName: string, line: number, character: number, reference: SourceReference): void {
    const id = this.getId(fileName, line, character);
    this.references.set(id, reference);
  }

  getReference(fileName: string, line: number, character: number): SourceReference | undefined {
    const id = this.getId(fileName, line, character);
    return this.references.get(id);
  }

  removeReference(fileName: string, line: number, character: number): void {
    const id = this.getId(fileName, line, character);
    this.references.delete(id);
  }

  addModuleToReference(fileName: string, line: number, character: number, module: ModuleReference): void {
    const sourceReference = this.getReference(fileName, line, character);
    if (!sourceReference) {
      console.log(`Missing SourceReference for (fileName: ${fileName}, line: ${line}, character: ${character}`)
      throw new Error("Missing source reference. Attempting to add a module to a non-existing reference");
    }
    if (!sourceReference.modules[module.name]) {
      sourceReference.modules[module.name] = [module];
      return;
    }

    sourceReference.modules[module.name].push(module);

  }

  clearReferences(): void {
    this.references.clear();
  }
}
