import * as bundledTs from 'typescript';
import * as path from 'node:path';
import relative from "resolve";

export const bundledTypescript = bundledTs;
const relativeResolve = relative.sync;

// Alias some exported typescript types
export type TsType = typeof bundledTs;
export type TsSourceFile = bundledTs.SourceFile;
export type TsLanguageService = bundledTs.LanguageService
export type TsNode = bundledTs.Node;
export type TsLanguageServiceHost = bundledTs.LanguageServiceHost;
export type TsLineAndCharacter = bundledTs.LineAndCharacter;
export type TsStringLiteral = bundledTs.StringLiteral;
export type TsReferenceEntry = bundledTs.ReferenceEntry;
export type TsProgram = bundledTs.Program;

export type RouteTree = {
  name: string,
  fileName: string,
  entries: RouteEntry[],
}

export type RouteEntry = {
  method: string,
  path: string,
  sources: SourceReference[],
}

export type SourceReference = {
  fileName: string,
  content: string,
  line: number,
  character: number,
}
