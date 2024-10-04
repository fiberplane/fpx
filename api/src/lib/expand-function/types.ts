import type ts from "typescript";

export type FunctionNode =
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression;

export type FunctionContextType = "unknown" | "function" | "type" | "variable";
