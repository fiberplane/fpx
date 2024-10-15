export type Template = "base" | "base-supa" | "sample-api" | "sample-d1";

export type Flags = Array<
  "install-dependencies" | "initialize-git" | "setup-neon"
>;

export class SuperchargerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuperchargerError";
  }
}

export const isError = (error: unknown): error is Error | SuperchargerError => {
  return error instanceof Error || error instanceof SuperchargerError;
};
