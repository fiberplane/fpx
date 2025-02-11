import type { User } from "./db";

export type Bindings = CloudflareBindings & {
  OPENAI_API_KEY: string;
};

export type Variables = {
  bearerToken: string;
  currentUser: User;
  verifiedToken: {
    sub: string;
    exp: number;
  };
};

export type FpAuthApp = {
  Bindings: Bindings;
  Variables: Variables;
};
