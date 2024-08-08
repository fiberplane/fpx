import { Context } from "hono";
import { WebHonc } from "./webhonc";

export function resolveWebhoncId(c: Context, id: string) {
  try {
    const doId = c.env.WEBHONC.idFromString(id);
    const webhonc = c.env.WEBHONC.get(doId) as DurableObjectStub<WebHonc>;
    return webhonc;
  } catch (error) {
    // TypeError is thrown when the id is not a valid Durable Object ID
    // we handle those cases but this is in case the error is something else
    if (!(error instanceof TypeError)) {
      console.error(error);
    }
    return null;
  }
}

export async function resolveBody(c: Context) {
  const contentType = c.req.header("content-type")?.toLowerCase();
  const method = c.req.method.toUpperCase();

  // Handle methods without body
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    console.debug("Method is GET, HEAD, or OPTIONS, returning null");
    return null;
  }

  // Handle empty body
  if (!contentType || c.req.header("content-length") === "0") {
    return null;
  }

  try {
    // JSON
    if (contentType.includes("application/json")) {
      console.debug("Content type is application/json, returning JSON");
      return await c.req.json();
    }

    // Form data (URL-encoded)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.debug(
        "Content type is application/x-www-form-urlencoded, returning FormData",
      );
      return Object.fromEntries(await c.req.formData());
    }

    // TODO: Handle multipart/form-data (can contain both text and binary data)

    // Plain text
    if (contentType.includes("text/plain")) {
      console.debug("Content type is text/plain, returning text");
      return await c.req.text();
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
      return await c.req.text();
    }

    // TODO: Handle binary data (application/octet-stream)
    // TODO: Handle image files
    // TODO: Handle PDF files

    console.debug("Content type is not recognized, returning text");
    // Default case: try to parse as text
    return await c.req.text();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return null;
  }
}
