import { HTTPException } from "hono/http-exception";
import { PLAYGROUND_SERVICES_URL } from "../../constants.js";
import type { Workflow } from "../../schemas/workflows.js";
import { z, type ZodError } from "zod";
import type { Context, Env } from "hono";
import type { FiberplaneAppType } from "../../types.js";
import { getContext } from "hono/context-storage";

export async function getWorkflowById<E extends Env>(
  workflowId: string,
  apiKey: string,
): Promise<{ data: Workflow }> {
  const c = getContext<FiberplaneAppType<E>>();

  const app = c.get("userApp");
  const env = c.get("userEnv");

  const path = `/api/workflows/${workflowId}`;
  const request = new Request(`${PLAYGROUND_SERVICES_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  // Check if we're running in the PLAYGROUND_SERVICES_URL itself 
  if (new URL(c.req.url).origin === PLAYGROUND_SERVICES_URL) {
    const response = await app.request(request, {}, env);
    if (!response.ok) {
      throw new HTTPException(response.status as 404, {
        message: await response.text(),
      });
    }
    return await response.json();
  }

  // Otherwise use external fetch
  const workflowResponse = await fetch(request);

  return await workflowResponse.json();
}

/**
 * Formats a ZodError into a readable string for debugging purposes.
 * Includes detailed information about validation errors including:
 * - Path to the error in the object
 * - Error code and message
 * - Validation details
 * - Fatal flag if present
 * - Union validation errors if present
 */
export function formatZodError(error: ZodError): string {
  return error.errors
    .map((err) => {
      const path =
        err.path.length > 0 ? `at path: "${err.path.join(".")}"` : "at root";
      const code = err.code ? ` [${err.code}]` : "";

      let details = "";

      // Handle invalid_type errors specifically
      if ("expected" in err && "received" in err) {
        details += `\n  Expected: ${err.expected}`;
        details += `\n  Received: ${err.received}`;
      }

      if ("fatal" in err && err.fatal) {
        details += "\n  Fatal: true";
      }
      if ("validation" in err) {
        details += `\n  Validation: ${err.validation}`;
      }
      if ("type" in err && !("expected" in err)) {
        // Avoid duplicate info for invalid_type
        details += `\n  Expected type: ${err.type}`;
      }
      if ("received" in err && !("expected" in err)) {
        // Avoid duplicate info for invalid_type
        details += `\n  Received: ${JSON.stringify(err.received)}`;
      }
      if ("unionErrors" in err && Array.isArray(err.unionErrors)) {
        details += "\n  Union validation errors:";
        err.unionErrors.forEach((unionError, index) => {
          details += `\n    Option ${index + 1}:\n      ${unionError.message.replace(/\n/g, "\n      ")}`;
        });
      }

      return `Error${code} ${path}\n  ${err.message}${details}`;
    })
    .join("\n\n");
}
