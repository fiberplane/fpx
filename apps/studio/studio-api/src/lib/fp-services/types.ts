import { z } from "zod";

// The payload we expect at `/v0/auth/success`
export const TokenPayloadSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
});
