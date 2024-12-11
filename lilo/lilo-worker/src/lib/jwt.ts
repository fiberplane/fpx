import { z } from "zod";

// Define the Zod schema for JWT payload
const LiloJWTPayloadSchema = z.object({
  sub: z.string(),
  iat: z.number(),
  nbf: z.number(),

  // Additional standard JWT claims we don't support
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),

  // Custom claims
  lilo_project_id: z.string().optional(),
});

export const createJwtPayload = (
  userId: string,
  projectId: string,
): JwtPayload => {
  return {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),

    // Custom claims
    lilo_project_id: projectId,
  };
};

// Infer the TypeScript type from the Zod schema
export type JwtPayload = z.infer<typeof LiloJWTPayloadSchema>;

// Type guard function using Zod schema
export const isJwtPayload = (payload: unknown): payload is JwtPayload => {
  const result = LiloJWTPayloadSchema.safeParse(payload);
  return result.success;
};

// Example usage of the type guard
export const validateJwtPayload = (payload: unknown): boolean => {
  if (!isJwtPayload(payload)) {
    return false;
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Validate timestamp claims
  if (payload.iat > currentTimestamp) {
    return false;
  }

  if (payload.nbf > currentTimestamp) {
    return false;
  }

  if (payload.exp && payload.exp < currentTimestamp) {
    return false;
  }

  return true;
};
