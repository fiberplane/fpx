import type { z } from "zod";
import { TokenService } from "./tokens.js";

interface FpServiceOptions {
  apiKey: string;
  baseUrl?: string;
}

export class FpService {
  readonly tokens: TokenService;

  constructor({ apiKey, baseUrl = "http://localhost:1234/api" }: FpServiceOptions) {
    this.tokens = new TokenService(apiKey, baseUrl);
  }
} 