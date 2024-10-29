import relative from "resolve";
import * as bundledTs from "typescript";
import type { SourceReferenceManager } from "./SourceReferenceManager";

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
export type TsProgram = bundledTs.Program;
export type TsReferenceEntry = bundledTs.ReferenceEntry;
export type TsSourceFile = bundledTs.SourceFile;
export type TsStringLiteral = bundledTs.StringLiteral;
export type TsSymbol = bundledTs.Symbol;
export type TsSyntaxKind = bundledTs.SyntaxKind;
export type TsTypeAliasDeclaration = bundledTs.TypeAliasDeclaration;
export type TsTypeChecker = bundledTs.TypeChecker;
export type TsVariableDeclaration = bundledTs.VariableDeclaration;
export type TsNodeArray<T extends TsNode> = bundledTs.NodeArray<T>;

export type RouteTree = {
  type: "ROUTE_TREE";
  id: string;
  name: string;
  fileName: string;
  baseUrl: string;
  /**
   * TODO: add source references
   * The Hono type is a generic that can be used
   * for instance to inject bindings/environment variables
   */
  entries: Array<Entry>;
};

type Entry = RouteEntry | RouteTreeReference | MiddlewareEntry;

export type RouteTreeReference = {
  type: "ROUTE_TREE_REFERENCE";

  targetId: string;
  /**
   *  `.routes()` accepts a path parameter
   */
  path: string;

  /**
   * Identifier for the route tree
   */
  name: string;
  fileName: string;
};

export const HONO_HTTP_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
] as const;
export type HonoHttpMethod = (typeof HONO_HTTP_METHODS)[number];

type RouteDetails = {
  id: string;
  path: string;
  sources: SourceReference[];
};

export type RouteEntry = {
  type: "ROUTE_ENTRY";
  method?: string;
} & RouteDetails;

export type MiddlewareEntry = {
  type: "MIDDLEWARE_ENTRY";
} & RouteDetails;

export type SearchContext = {
  sourceReferenceManager: SourceReferenceManager;
  service: TsLanguageService;
  ts: TsType;
  errorCount: number;
  program: TsProgram;
  checker: TsTypeChecker;
  addRouteTree: (route: RouteTree) => void;
  getFile: (fileName: string) => TsSourceFile | undefined;
  getId: (fileName: string, location: number) => string;
  asRelativePath(fileName: string): string;
  asAbsolutePath(fileName: string): string;
};

export type SourceReference = {
  id: string;
  fileName: string;
  content: string;
  line: number;
  character: number;
  modules: Record<string, Array<ModuleReference>>;
  references: Array<SourceReference>;
};

export type ModuleReference = {
  /* The name of the module */
  name: string;
  /**
   * The import path of the module, this can be the same as the name or a subpath
   * For instance for hono it can be hono/cors and while the name of the package is still hono
   */
  importPath: string;
  version?: string;
  import: string;
};

/**
 * Different types of elements that can be part of a route tree
 */
export type RouteElement =
  | RouteTree
  | RouteEntry
  | RouteTreeReference
  | MiddlewareEntry;
