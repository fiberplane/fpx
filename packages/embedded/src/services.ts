import { z } from "zod";

// Temporary implementation until we have a proper services layer
const CreateTokenResponseSchema = z.object({ token: z.string() });
const VerifyTokenResponseSchema = z.object({ valid: z.boolean() });
const RevokeTokenResponseSchema = z.object({ success: z.boolean() });

interface FpServiceOptions {
  apiKey: string;
  baseUrl?: string;
}

class BaseService {
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

class TokenService extends BaseService {
  async createToken(metadata: string) {
    return this.request(CreateTokenResponseSchema, '/tokens', {
      method: 'PUT',
      body: JSON.stringify({metadata}),
    });
  }

  async verifyToken(token: string) {
    return this.request(VerifyTokenResponseSchema, '/tokens/verify', {
      method: 'POST',
      body: JSON.stringify({token}),
    });
  }

  async revokeToken(token: string) {
    return this.request(RevokeTokenResponseSchema, `/tokens/revoke/${token}`, {
      method: 'DELETE',
    });
  }
}

export class FpService {
  readonly tokens: TokenService;

  constructor({ apiKey, baseUrl = "http://localhost:1234/api" }: FpServiceOptions) {
    this.tokens = new TokenService(apiKey, baseUrl);
  }
}
