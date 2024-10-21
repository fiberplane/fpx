import { URL } from "node:url";
import { makeFpAuthRequest } from "./request.js";

export async function getUser(token: string) {
  try {
    const response = await makeFpAuthRequest({
      method: "GET",
      path: "/user",
      token,
    });

    // NOTE - The API will return 404 for no matching user for token
    // TODO - Delete associated token on our end
    if (response?.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const verifiedToken = await response.json();
    return verifiedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
}

/**
 * Verify a token with the authentication API
 * @param token The token to verify
 * @returns A promise that resolves to the verification result
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const verifiedToken = await response.json();
    return verifiedToken;
  } catch (error) {
    console.error("Error verifying token:", error);
    throw error;
  }
}
