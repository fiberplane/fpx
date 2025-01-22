import { z } from "zod";

export const CreateTokenResponseSchema = z.object({ token: z.string() });

export type CreateTokenResponse = z.infer<typeof CreateTokenResponseSchema>;

export const VerifyTokenResponseSchema = z.object({ valid: z.boolean() });

export type VerifyTokenResponse = z.infer<typeof VerifyTokenResponseSchema>;

export const RevokeTokenResponseSchema = z.object({ success: z.boolean() });

export type RevokeTokenResponse = z.infer<typeof RevokeTokenResponseSchema>;
