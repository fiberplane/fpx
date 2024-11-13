import relative from "resolve";
import type { Tagged } from "type-fest";
import * as bundledTs from "typescript";
import type { ResourceManager } from "./ResourceManager";

export const bundledTypescript = bundledTs;
export const relativeResolve = relative.sync;

// Alias some exported typescript types
export type TsType = typeof bundledTs;
export type TsArrowFunction = bundledTs.ArrowFunction;
export type TsCallExpression = bundledTs.CallExpression;
export type TsCompilerOptions = bundledTs.CompilerOptions;
export type TsDeclaration = bundledTs.Declaration;
export type TsExportSpecifier = bundledTs.ExportSpecifier;
export type TsExpression = bundledTs.Expression;
export type TsFunctionDeclaration = bundledTs.FunctionDeclaration;
export type TsIdentifier = bundledTs.Identifier;
export type TsLanguageService = bundledTs.LanguageService;
export type TsLanguageServiceHost = bundledTs.LanguageServiceHost;
export type TsLineAndCharacter = bundledTs.LineAndCharacter;
export type TsModuleResolutionHost = bundledTs.ModuleResolutionHost;
export type TsNode = bundledTs.Node;
export type TsNodeArray<T extends TsNode> = bundledTs.NodeArray<T>;
export type TsProgram = bundledTs.Program;
export type TsReferenceEntry = bundledTs.ReferenceEntry;
export type TsReturnStatement = bundledTs.ReturnStatement;
export type TsSourceFile = bundledTs.SourceFile;
export type TsStringLiteral = bundledTs.StringLiteral;
export type TsSymbol = bundledTs.Symbol;
export type TsSyntaxKind = bundledTs.SyntaxKind;
export type TsTypeAliasDeclaration = bundledTs.TypeAliasDeclaration;
export type TsTypeChecker = bundledTs.TypeChecker;
export type TsVariableDeclaration = bundledTs.VariableDeclaration;
export type TsFunctionExpression = bundledTs.FunctionExpression;
export type TsISnapShot = bundledTs.IScriptSnapshot;

export type RouteTreeId = Tagged<string, "RouteTreeId">;
export type RouteTreeReferenceId = Tagged<string, "RouteTreeReferenceId">;
export type MiddlewareEntryId = Tagged<string, "MiddlewareEntryId">;
export type RouteEntryId = Tagged<string, "RouteEntryId">;
export type SourceReferenceId = Tagged<string, "SourceReferenceId">;
export type ModuleReferenceId = Tagged<string, "ModuleReferenceId">;

/// Basic types

type FileReference = {
  fileName: string;
  position: number;
};

type RouteDetails = {
  path: string;
  sources: Set<SourceReferenceId>;
  modules: Set<ModuleReferenceId>;
} & FileReference;

// Specific route related types
export type RouteTree = {
  type: "ROUTE_TREE";
  id: RouteTreeId;
  name: string;
  baseUrl: string;
  /**
   * TODO: add source references
   * The Hono type is a generic that can be used
   * for instance to inject bindings/environment variables
   */
  entries: Array<RouteTreeEntryId>;

  sources: Set<SourceReferenceId>;
  modules: Set<ModuleReferenceId>;
} & FileReference;

export type RouteTreeReference = {
  type: "ROUTE_TREE_REFERENCE";
  id: RouteTreeReferenceId;

  targetId: RouteTreeId;
  /**
   *  `.routes()` accepts a path parameter
   */
  path: string;

  /**
   * Identifier for the route tree
   */
  name: string;
  fileName: string;
  position: number;
};

// TODO: handle export ... from ... cases
export type ModuleReference = {
  type: "MODULE_REFERENCE";
  id: ModuleReferenceId;
  /**
   * The name of the module
   *
   * For hono it will be hono, even if the import path is hono/cors
   ***/
  name: string;
  /**
   * The import path of the module, this can be the same as the name or a subpath
   * For instance for hono it can be hono/cors and while the name of the package is still hono
   */
  importPath: string;
  /**
   * The path id of the module, which is typically the import path of the module
   * unless it's a local import/module
   */
  pathId: string;
  version?: string;
  /**
   * What is imported from the module
   *
   * Like in case of hono it will be: Hono
   * Here's what the import would look like:
   *
   * import { Hono } from "hono";
   *
   * However this can also be an aliased import:
   *
   * import { Hono as Hon } from "hono";
   */
  import: string;
  // /**
  //  * Alias for the import
  //  *
  //  */
  // importAlias?: string;
};

export type SourceReference = {
  type: "SOURCE_REFERENCE";
  id: SourceReferenceId;
  content: string;
  line: number;
  character: number;
  modules: Set<ModuleReferenceId>;
  references: Set<SourceReferenceId>;
} & FileReference;

export const HONO_HTTP_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
] as const;
export type HonoHttpMethod = (typeof HONO_HTTP_METHODS)[number];
export function isHonoMethod(unknown: string): unknown is HonoHttpMethod {
  return HONO_HTTP_METHODS.includes(unknown as HonoHttpMethod);
}

export type RouteEntry = {
  type: "ROUTE_ENTRY";
  id: RouteEntryId;
  method?: HonoHttpMethod | undefined;
} & RouteDetails;

export type MiddlewareEntry = {
  type: "MIDDLEWARE_ENTRY";
  id: MiddlewareEntryId;
} & RouteDetails;

export type RouteTreeEntry = RouteEntry | RouteTreeReference | MiddlewareEntry;
export type RouteTreeEntryId =
  | RouteEntryId
  | RouteTreeReferenceId
  | MiddlewareEntryId;

/**
 * Different types of elements that can be part of a route tree
 */
export type RouteElement =
  | RouteTree
  | RouteEntry
  | RouteTreeReference
  | MiddlewareEntry;

export type TreeResource =
  | RouteTree
  | RouteEntry
  | RouteTreeReference
  | MiddlewareEntry
  | SourceReference
  | ModuleReference;

export type TreeResourceType = TreeResource["type"];
export type TreeResourceId = TreeResource["id"];
export type LocalFileResource =
  | RouteTree
  | RouteEntry
  | MiddlewareEntry
  | SourceReference
  | RouteTreeReference;
export type LocalFileResourceId = LocalFileResource["id"];

/**
 * This "context" is used to provide access to resources
 * like the language service/program/etc.
 */
export type SearchContext = {
  resourceManager: ResourceManager;
  service: TsLanguageService;
  ts: TsType;
  errorCount: number;
  program: TsProgram;
  checker: TsTypeChecker;
  getFile: (fileName: string) => TsSourceFile | undefined;
};

/**
 * An event describing a change to a text document. If only a text is provided
 * it is considered to be the full content of the document.
 */
export type TextDocumentContentChangeEvent = {
  text: string;
};
