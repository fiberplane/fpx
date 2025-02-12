import { URL } from "node:url";
import logger from "../../logger/index.js";
import {
  ERROR_TYPE_INVALID_TOKEN,
  ERROR_TYPE_TOKEN_EXPIRED,
  ERROR_TYPE_UNAUTHORIZED,
  InvalidTokenError,
  TokenExpiredError,
  UnauthorizedError,
} from "./errors.js";
import { makeFpAuthRequest } from "./request.js";

export async function getUser(token: string) {
  try {
    const response = await makeFpAuthRequest({
      method: "GET",
      path: "/user",
      token,
    });

    // NOTE - The API will return 404 for no matching user for token
    if (response?.status === 404) {
      return null;
    }

    if (response.status === 401) {
      const errorData = (await response.json()) as {
        errorType: string;
        message: string;
      };
      switch (errorData?.errorType) {
        case ERROR_TYPE_UNAUTHORIZED:
          throw new UnauthorizedError();
        case ERROR_TYPE_INVALID_TOKEN:
          throw new InvalidTokenError();
        case ERROR_TYPE_TOKEN_EXPIRED:
          throw new TokenExpiredError();
        default:
          throw new UnauthorizedError(
            `Unauthorized: ${errorData?.errorType || "unknown"}`,
          );
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const verifiedToken = await response.json();
    return verifiedToken;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error verifying token:", errorMessage);
    throw error;
  }
}

/**
 * Verify a token with the authentication API
 * @param token The token to verify
 * @returns A promise that resolves to the verification result
 * @throws {Error} with specific error type for unauthorized, invalid token, or expired token
 */
export async function verifyToken(token: string): Promise<unknown> {
  const baseUrl = process.env.FPX_AUTH_BASE_URL;
  if (!baseUrl) {
    throw new Error("FPX_AUTH_BASE_URL environment variable is not set");
  }

  const url = new URL("/verify", baseUrl);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const errorData = (await response.json()) as {
        errorType: string;
        message: string;
      };
      switch (errorData?.errorType) {
        case ERROR_TYPE_UNAUTHORIZED:
          throw new UnauthorizedError();
        case ERROR_TYPE_INVALID_TOKEN:
          throw new InvalidTokenError();
        case ERROR_TYPE_TOKEN_EXPIRED:
          throw new TokenExpiredError();
        default:
          throw new UnauthorizedError(
            `Unauthorized: ${errorData?.errorType || "unknown"}`,
          );
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const verifiedToken = await response.json();
    return verifiedToken;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error verifying token:", errorMessage);
    throw error;
  }
}
