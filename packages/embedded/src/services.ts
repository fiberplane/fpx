import {
  type CreateTokenResponse,
  CreateTokenResponseSchema,
  type RevokeTokenResponse,
  RevokeTokenResponseSchema,
  type VerifyTokenResponse,
  VerifyTokenResponseSchema,
} from "@fiberplane/fpx-types";

interface ServiceOptions {
  apiKey: string;
  baseUrl?: string;
}

export class Service {
  private apiKey: string;
  private baseUrl = "http://localhost:1234/api";

  constructor({ apiKey, baseUrl }: ServiceOptions) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  async createToken(metadata: string): Promise<CreateTokenResponse> {
    const response = await fetch(`${this.baseUrl}/tokens`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ metadata }),
    });

    const json = await response.json();

    return CreateTokenResponseSchema.parse(json);
  }

  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const response = await fetch(`${this.baseUrl}/tokens/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ token }),
    });

    const json = await response.json();

    return VerifyTokenResponseSchema.parse(json);
  }

  async revokeToken(token: string): Promise<RevokeTokenResponse> {
    const response = await fetch(`${this.baseUrl}/tokens/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ token }),
    });

    const json = await response.json();

    return RevokeTokenResponseSchema.parse(json);
  }
}
