import type { MapLike } from "typescript";
import * as path from "node:path";
import * as fs from "node:fs";
import { EventEmitter } from "node:events";
import { type FSWatcher, watch } from "chokidar";
import type { TextDocumentContentChangeEvent } from "vscode-languageserver-protocol";

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
) {
  let debounceTimeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

type FileAddedEvent = {
  type: "fileAdded";
  payload: {
    fileName: string;
    content: string;
  };
};

type FileRemovedEvent = {
  type: "fileRemoved";
  payload: {
    fileName: string;
  };
};

type FileUpdatedEvent = {
  type: "fileUpdated";
  payload: {
    fileName: string;
    changes: Array<TextDocumentContentChangeEvent>;
  };
};

type FileEvents = {
  fileAdded: [FileAddedEvent];
  fileRemoved: [FileRemovedEvent];
  fileUpdated: [FileUpdatedEvent];
};

export class Watcher extends EventEmitter<FileEvents> {
  private folderPath: string;
  private fileVersions: MapLike<{ version: number; content: string }> = {};
  private watcher: FSWatcher | null = null;
  private warmUpBacklog: string[] = [];
  private batchWarmUp: () => void;
  private files: string[] = [];
  constructor(
    folderPath: string,
    // languageService: ts.LanguageService,
  ) {
    super();
    this.folderPath = path.normalize(folderPath);
    this.batchWarmUp = debounce(() => this.rawBatchWarmUp(), 5);
  }

  public start() {
    this.initFileVersions(this.getAllTsFiles(this.folderPath));
    this.initializeWatcher();
  }

  // Initialize file versions for existing files
  private initFileVersions(fileNames: string[]) {
    // console.log("fileNames", fileNames);
    for (const fileName of fileNames) {
      this.addFile(fileName);
      // const content = fs.readFileSync(fileName, "utf-8");
      // this.fileVersions[removeFolderPath(fileName, this.folderPath)] = {
      //   version: 0,
      //   content,
      // };
    }
  }

  // Recursively get all .ts and .tsx files from a directory
  private getAllTsFiles(folderPath: string): string[] {
    const tsFiles: string[] = [];

    function getFilesFromDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          getFilesFromDir(fullPath);
        } else if (
          entry.isFile() &&
          (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))
        ) {
          tsFiles.push(fullPath);
        }
      }
    }

    getFilesFromDir(folderPath);
    return tsFiles;
  }

  // public findHonoReferences() {
  //   const program = this.languageService.getProgram();
  //   // this.languageService.findReferences("Hono", 0);
  //   // this.languageService.findReferences
  //   if (!program) {
  //     return;
  //   }

  //   const checker = program.getTypeChecker();
  //   const sourceFiles = program.getSourceFiles();

  //   for (const sourceFile of sourceFiles) {
  //     // console.log(
  //     //   "sourceFile",
  //     //   sourceFile.fileName,
  //     //   this.getDiagnostics(sourceFile.fileName),
  //     // );
  //     // const diagnostics = this.getDiagnostics(
  //     //   removeFolderPath(sourceFile.fileName, this.folderPath),
  //     // );
  //     // if (diagnostics.length > 0) {
  //     //   console.log(
  //     //     "diagnostics",
  //     //     diagnostics,
  //     //     "sourceFile.fileName",
  //     //     sourceFile.fileName,
  //     //   );
  //     //   throw new Error("diagnostics found");
  //     // }
  //     if (sourceFile.isDeclarationFile) {
  //       break;
  //     }

  //     //   }
  //     // }
  //     // Traverse each node in the AST
  //     ts.forEachChild(sourceFile, function visit(node) {
  //       // Look for identifiers that could reference the Hono type
  //       if (ts.isIdentifier(node)) {
  //         const symbol = checker.getSymbolAtLocation(node);
  //         // console.log("symbol", symbol);
  //         if (symbol && isHonoFromHonoPackage(symbol, checker)) {
  //           const { line, character } = ts.getLineAndCharacterOfPosition(
  //             sourceFile,
  //             node.getStart(),
  //           );
  //           console.log(
  //             `Found reference to Hono at ${sourceFile.fileName}:${line + 1}:${character + 1}`,
  //           );
  //         }
  //       }

  //       ts.forEachChild(node, visit);
  //     });
  //   }
  // }

  // whatIsThis() {
  //   this.languageService.
  //
  // }
  // Initialize the file system watcher
  private initializeWatcher() {
    // console.log(
    //   "Starting file watcher...",
    //   path.join(this.folderPath, "**", "*.ts"),
    //   path.join(this.folderPath, "index.ts"),
    // );
    this.watcher = watch(
      [
        this.folderPath,
        // path.join(this.folderPath, "**", "*.ts"),
        // path.join(this.folderPath, "index.ts"),
        // path.join(this.folderPath, "**", "*.tsx"),
      ],
      // {
      // ignoreInitial: true,
      // atomic: true,
      // awaitWriteFinish: true,
      // },
    );
    this.watcher.on("add", (fileName) =>
      this.addFile(removeFolderPath(fileName, this.folderPath)),
    );
    this.watcher.on("change", (fileName) =>
      this.updateFile(removeFolderPath(fileName, this.folderPath)),
    );
    this.watcher.on("unlink", (fileName) =>
      this.removeFile(removeFolderPath(fileName, this.folderPath)),
    );
    // this.watcher.on("")
    // (eventType: fs.WatchEventType, fileName) => {
    //   if (!fileName) {
    //     return;
    //   }

    //   const fullPath = path.join(this.folderPath, fileName);
    //   if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) {
    //     console.log(
    //       "watcher",
    //       eventType,
    //       path.join(this.folderPath, fileName),
    //     );
    //     if (eventType === "rename") {
    //       if (fs.existsSync(fullPath)) {
    //         console.log(`File added: ${fileName}`);
    //         this.addFile(fullPath);
    //         return;
    //       }
    //       // } else {
    //       console.log(`File removed: ${fileName}`);
    //       this.removeFile(fullPath);
    //       return;
    //       // }
    //     }

    //     if (eventType === "change") {
    //       console.log(`File modified: ${fileName}`);
    //       this.updateFile(fullPath);
    //       return;
    //     }
    //   }
    // },
    // );
  }

  public warmUpForFile(fileName: string) {
    if (!this.warmUpBacklog.includes(fileName)) {
      this.warmUpBacklog.push(fileName);
      this.batchWarmUp();
    }
  }

  private rawBatchWarmUp() {
    console.log("raw batch warm up");
    if (this.warmUpBacklog.length === 0) {
      return;
    }

    const files = this.warmUpBacklog;
    this.warmUpBacklog = [];
    for (const file of files) {
      this.getDiagnostics(file);
    }

    console.log("emitting updated");
    // this.emit("updated", files);
  }

  public getDiagnostics(fileName: string) {
    console.log("getDiagnostics", fileName);
    // if (!fs.existsSync(fileName)) {
    //   console.log("what is this", fileName);
    // }
    // console.log("checked, file exists", fileName);

    // // fileName.stri
    // const shortName = removeFolderPath(fileName, this.folderPath);
    // console.log("shortName", shortName);
    // return this.languageService.getSemanticDiagnostics(shortName);
  }

  // Add a new file to the language service
  private addFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    const content = fs.readFileSync(fileName, "utf-8");
    this.fileVersions[fileName] = { version: 0, content };
    const event: FileEvents["fileAdded"][0] = {
      type: "fileAdded" as const,
      payload: {
        fileName,
        content,
      },
    };

    this.emit(event.type, event);
  }

  // Remove a file from the language service
  private removeFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    delete this.fileVersions[fileName];
    this.emit("fileRemoved", {
      type: "fileRemoved",
      payload: {
        fileName,
      },
    });
  }

  // Update a file's content and version (when modified)
  private updateFile(fileName: string) {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return;
    }

    if (this.fileVersions[fileName]) {
      const content = fs.readFileSync(fileName, "utf-8");
      if (this.fileVersions[fileName].content === content) {
        return;
      }

      this.fileVersions[fileName].version++;
      this.fileVersions[fileName].content = content;

      const change: TextDocumentContentChangeEvent = {
        text: content,
      };

      this.emit("fileUpdated", {
        type: "fileUpdated" as const,
        payload: {
          fileName,
          changes: [change],
        },
      });
    }
  }

  // Public method to stop the watcher and the language service
  public teardown() {
    if (this.watcher) {
      console.log("Stopping file watcher...");
      this.watcher.close();
      this.watcher = null;
    }

    // if (this.languageService) {
    // console.log("Stopping language service...");
    // this.languageService = null;
    // }
  }
}

// function monitor(folderPath: string) {
//   const watcher = new Watcher(folderPath);

//   // // Simulate stopping the watcher after some time (e.g., in test teardown)
//   // setTimeout(() => {
//   //   watcher.teardown();
//   // }, 10000); // Stop watcher after 10 seconds (example)
//   return () => watcher.teardown();
// }

// // // Example usage: Running multiple watchers in parallel
// // function runParallelWatchers() {
// //   const watcher1 = new Watcher("./src/project1"); // Watch folder for project1
// //   const watcher2 = new Watcher("./src/project2"); // Watch folder for project2

// //   // Simulate stopping the watchers after some time (e.g., in test teardown)
// //   setTimeout(() => {
// //     watcher1.teardown();
// //     watcher2.teardown();
// //   }, 10000); // Stop watchers after 10 seconds (example)
// // }

// // runParallelWatchers();

function removeFolderPath(location: string, _folderPath: string) {
  // console.log({
  //   location,
  //   // folderPath,
  // });
  // const folderPath = process.cwd();
  // // Normalize both paths to ensure platform consistency
  // const normalizedFullPath = path.normalize(location);
  // // const normalizedFolderPath = path.normalize(folderPath);

  // // Check if the fullPath starts with folderPath
  // if (normalizedFullPath.startsWith(folderPath)) {
  //   // Slice the folderPath from fullPath and remove any leading path separators
  //   return normalizedFullPath.slice(folderPath.length).replace(/^[/\\]/, "");
  // }

  // Return the original fullPath if it doesn't start with folderPath
  return location;
}

// // Helper function to check if the symbol is the Hono type from the "hono" package
// function isHonoFromHonoPackage(
//   symbol: ts.Symbol,
//   checker: ts.TypeChecker,
// ): boolean {
//   const declarations = symbol.getDeclarations();
//   if (!declarations || declarations.length === 0) {
//     return false;
//   }

//   for (const decl of declarations) {
//     const sourceFile = decl.getSourceFile();
//     console.log("decl", sourceFile.fileName);
//     const importStatements = sourceFile.statements.filter(
//       ts.isImportDeclaration,
//     );

//     for (const importDecl of importStatements) {
//       const moduleSpecifier = importDecl.moduleSpecifier.getText(sourceFile);
//       console.log("moduleSpecifier", moduleSpecifier);
//       if (moduleSpecifier.includes("hono")) {
//         // Check if this symbol is exported from the "hono" package
//         const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
//         // console.log("type", type);
//         if (type.symbol?.getName() === "Hono") {
//           return true;
//         }
//       }
//     }
//   }
//   return false;
// }
