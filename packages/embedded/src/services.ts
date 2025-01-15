import { z } from "zod";

interface ServiceOptions {
  apiKey: string;
}

const CreateTokenResponseSchema = z.object({ token: z.string() });

type CreateTokenResponse = z.infer<typeof CreateTokenResponseSchema>;

const VerifyTokenResponseSchema = z.object({ isValid: z.boolean() });

type VerifyTokenResponse = z.infer<typeof VerifyTokenResponseSchema>;

const RevokeTokenResponseSchema = z.object({ success: z.boolean() });

type RevokeTokenResponse = z.infer<typeof RevokeTokenResponseSchema>;

export class Service {
  private apiKey: string;
  private baseUrl = "http://localhost:1234/api";

  constructor({ apiKey }: ServiceOptions) {
    this.apiKey = apiKey;
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
