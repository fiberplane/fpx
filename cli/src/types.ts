export type Template = "base" | "base-supa" | "sample-api" | "sample-d1";

export type Flags = Array<
  "install-dependencies" | "initialize-git" | "setup-neon"
>;

export class CodeGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodeGenError";
  }
}

export const isError = (error: unknown): error is Error | CodeGenError => {
  return error instanceof Error || error instanceof CodeGenError;
};
