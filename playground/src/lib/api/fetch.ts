import { parseEmbeddedConfig } from "@/utils";
import { parseErrorResponse } from "./errors";

/**
 * Performs a fetch call, checks for errors, and processes the response.
 * @NOTE - This function does NOT add the fp api base path to the url.
 *
 * @param path - The URL to fetch
 * @param options - Optional fetch options
 * @param parser - An optional parser function for processing the response
 * @returns The processed response of type T
 */
export async function baseFetch<T>(
  url: string,
  options?: RequestInit,
  parser?: (response: Response) => Promise<T>,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw error;
  }

  return parser ? parser(response) : response.json();
}

/**
 * Performs a fetch call, checks for errors, and processes the response.
 *
 * @NOTE - This function adds the fiberplane api base path to the url.
 *
 * @param path - The relative path (on the same origin) to fetch
 * @param options - Optional fetch options
 * @param parser - An optional parser function for processing the response
 *
 * @returns The processed response of type T
 */
export async function fpFetch<T>(
  path: string,
  options?: RequestInit,
  parser?: (response: Response) => Promise<T>,
): Promise<T> {
  if (!path.startsWith("/")) {
    throw new Error("path must be relative to the origin");
  }

  const basePrefix = getFpApiBasePath();
  const url = `${basePrefix}${path}`;
  return baseFetch(url, options, parser);
}

/**
 * Returns the fiberplane api base path, unless we're running in dev mode.
 */
export function getFpApiBasePath(): string {
  // If we're running the SPA in dev mode directly, there's no need to add the base path
  if (import.meta.env.DEV) {
    return "";
  }

  // This case should never happen, since the UI should fail
  // when the root element's `dataset.options` are not found
  const rootElement = document.getElementById("root");
  if (!rootElement?.dataset.options) {
    return "";
  }

  const { mountedPath } = parseEmbeddedConfig(rootElement);

  return mountedPath;
}
