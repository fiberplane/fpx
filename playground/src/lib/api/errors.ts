export class FpApiError extends Error {
  statusCode?: number;
  details?: string;

  constructor(message: string, statusCode?: number, details?: string) {
    super(message);
    this.name = "FpApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class FetchOpenApiSpecError extends Error {
  path?: string;
  statusCode?: number;
  details?: string;

  constructor(
    message: string,
    path?: string,
    statusCode?: number,
    details?: string,
  ) {
    super(message);
    this.name = "FetchOpenApiSpecError";
    this.path = path;
    this.statusCode = statusCode;
    this.details = details;
  }
}
/**
 * Parses an error response from the API into an `FpApiError`.
 */
export async function parseErrorResponse(
  response: Response,
): Promise<FpApiError> {
  const contentType = response.headers.get("content-type");
  let message = `Request failed with status ${response.status}`;
  let details: string | undefined;

  try {
    if (contentType?.includes("application/json")) {
      const error = await response.json();
      message = error.message || message;
      details = JSON.stringify(error);
    } else if (contentType?.includes("text/")) {
      message = await response.text();
    }
  } catch (_error) {
    // If parsing fails, retain the default message
  }

  return new FpApiError(message, response.status, details);
}

export function isFeatureDisabledError(error: unknown) {
  return isFpApiError(error) && error.statusCode === 402;
}

function isFpApiError(error: unknown): error is FpApiError {
  return error instanceof FpApiError;
}

export function isFetchOpenApiSpecError(error: unknown) {
  return error instanceof FetchOpenApiSpecError;
}

export function isFailedToFetchError(error: unknown) {
  return error instanceof Error && error.message === "Failed to fetch";
}
