import type { z } from "zod";
import { TokenService } from "./tokens.js";

interface FpServiceOptions {
  apiKey: string;
  baseUrl?: string;
}

export class BaseService {
  protected apiKey: string;
  protected baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  protected async request<ResponseSchema>(schema: z.ZodType<ResponseSchema>, endpoint: string, options: RequestInit = {}): Promise<ResponseSchema> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const json = await response.json();
    return schema.parse(json);
  }
}

export class FpService {
  readonly tokens: TokenService;

  constructor({ apiKey, baseUrl = "http://localhost:1234/api" }: FpServiceOptions) {
    this.tokens = new TokenService(apiKey, baseUrl);
  }
} 