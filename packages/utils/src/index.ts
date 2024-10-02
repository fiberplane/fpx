import type { HonoRequest } from "hono";

export function headersToObject(headers: Headers) {
  const returnObject: Record<string, string> = {};
  headers.forEach((value, key) => {
    returnObject[key] = value;
  });

  return returnObject;
}

export async function resolveBody<
  Request extends Pick<
    HonoRequest,
    "header" | "method" | "formData" | "json" | "text"
  >,
>(request: Request) {
  const contentType = request.header("content-type")?.toLowerCase();
  const method = request.method.toUpperCase();

  // Handle methods without body
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    console.debug("Method is GET, HEAD, or OPTIONS, returning null");
    return null;
  }

  // Handle empty body
  if (!contentType || request.header("content-length") === "0") {
    return null;
  }

  try {
    // JSON
    if (contentType.includes("application/json")) {
      console.debug("Content type is application/json, returning JSON");
      return await request.json();
    }

    // Form data (URL-encoded)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.debug(
        "Content type is application/x-www-form-urlencoded, returning FormData",
      );
      return Object.fromEntries(await request.formData());
    }

    // TODO: Handle multipart/form-data (can contain both text and binary data)

    // Plain text
    if (contentType.includes("text/plain")) {
      console.debug("Content type is text/plain, returning text");
      return await request.text();
    }

    // Handle XML, HTML, JavaScript, CSS, and CSV files and other
    // formats that for some reason you'd send to your API
    if (
      contentType.includes("application/xml") ||
      contentType.includes("text/xml") ||
      contentType.includes("text/html") ||
      contentType === "application/javascript" ||
      contentType === "text/javascript" ||
      contentType === "text/css" ||
      contentType === "text/csv"
    ) {
      console.debug(
        "Content type is XML, HTML, JavaScript, CSS, or CSV, returning text",
      );
      return await request.text();
    }

    // TODO: Handle binary data (application/octet-stream)
    // TODO: Handle image files
    // TODO: Handle PDF files

    console.debug("Content type is not recognized, returning text");
    // Default case: try to parse as text
    return await request.text();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return null;
  }
}
