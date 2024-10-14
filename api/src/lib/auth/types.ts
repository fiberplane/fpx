import { z } from "zod";

// The payload we expect at `/auth/github/success`
export const TokenPayloadSchema = z.object({ token: z.string() });
