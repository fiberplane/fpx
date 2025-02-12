import { HTTPException } from "hono/http-exception";
import { PLAYGROUND_SERVICES_URL } from "../../constants.js";
import { Workflow } from "../../schemas/workflows.js";
import { z, ZodError } from "zod";

export async function getWorkflowById(
  workflowId: string,
  apiKey: string,
): Promise<{ data: Workflow }> {
  const workflowResponse = await fetch(
    // `http://localhost:7676/api/workflows/${workflowId}`,
    `${PLAYGROUND_SERVICES_URL}/api/workflows/${workflowId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!workflowResponse.ok) {
    throw new HTTPException(404, { message: "Workflow not found" });
  }

  return await workflowResponse.json();
}

export function createZodSchemaFromJsonSchema(
  schema: z.ZodType | Record<string, unknown>,
): z.ZodType {
  if (
    !schema ||
    typeof schema !== "object" ||
    Object.keys(schema).length === 0
  ) {
    return z.record(z.unknown());
  }

  const jsonSchema = schema as Record<string, unknown>;
  const type = jsonSchema.type as string;

  switch (type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "object": {
      const properties = jsonSchema.properties as Record<string, unknown>;
      if (properties) {
        const shape: Record<string, z.ZodType> = {};
        for (const [key, value] of Object.entries(properties)) {
          shape[key] = createZodSchemaFromJsonSchema(value as z.ZodType);
        }
        const schema = z.object(shape);
        const required = jsonSchema.required as string[];
        return required?.length
          ? schema.required(
              Object.fromEntries(required.map((r) => [r, true])) as {
                [k in string]: true;
              },
            )
          : schema;
      }
      return z.record(z.unknown());
    }
    case "array": {
      const items = jsonSchema.items;
      return z.array(
        items ? createZodSchemaFromJsonSchema(items as z.ZodType) : z.unknown(),
      );
    }
    default:
      return z.unknown();
  }
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
      if ('expected' in err && 'received' in err) {
        details += `\n  Expected: ${err.expected}`;
        details += `\n  Received: ${err.received}`;
      }

      if ("fatal" in err && err.fatal) {
        details += "\n  Fatal: true";
      }
      if ("validation" in err) {
        details += `\n  Validation: ${err.validation}`;
      }
      if ("type" in err && !('expected' in err)) { // Avoid duplicate info for invalid_type
        details += `\n  Expected type: ${err.type}`;
      }
      if ("received" in err && !('expected' in err)) { // Avoid duplicate info for invalid_type
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
