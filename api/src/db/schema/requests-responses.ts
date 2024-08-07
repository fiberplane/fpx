import type { Context } from "hono";
import { safeParseJson } from "../../lib/utils.js";
import logger from "../../logger.js";

export type SerializedFile = {
  name: string;
  type: string;
  size: number;
};

/**
 * Helper that serializes the request body into a format that can be stored in the database
 *
 * This will *not* store binary data, for example, like File objects
 */
export async function serializeRequestBodyForFpxDb(ctx: Context) {
  const contentType = ctx.req.header("content-type");
  const requestMethod = ctx.req.method;
  let requestBody:
    | null
    | string
    | {
        [x: string]: string | SerializedFile | (string | SerializedFile)[];
      } = null;
  if (ctx.req.raw.body) {
    if (requestMethod === "GET" || requestMethod === "HEAD") {
      logger.warn(
        "Request method is GET or HEAD, but request body is not null",
      );
      requestBody = null;
    } else if (contentType?.includes("application/json")) {
      // NOTE - This kind of handles the case where the body is note valid json,
      //        but the content type is set to application/json
      const textBody = await ctx.req.text();
      requestBody = safeParseJson(textBody);
    } else if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData = await ctx.req.formData();
      requestBody = {};
      // @ts-expect-error - MDN says formData does indeed have an entries method :thinking_face:
      for (const [key, value] of formData.entries()) {
        requestBody[key] = value;
      }
    } else if (contentType?.includes("multipart/form-data")) {
      // NOTE - `File` will just show up as an empty object in sqllite - could be nice to record metadata?
      //         like the name of the file
      const formData = await ctx.req.parseBody({ all: true });
      requestBody = {};
      for (const [key, value] of Object.entries(formData)) {
        if (Array.isArray(value)) {
          requestBody[key] = value.map(serializeFormDataValue);
        } else {
          requestBody[key] = serializeFormDataValue(value);
        }
      }
    } else if (contentType?.includes("application/octet-stream")) {
      requestBody = "<binary data>";
    } else {
      requestBody = await ctx.req.text();
    }
  }

  return requestBody;
}

function serializeFile(file: File): SerializedFile {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

function serializeFormDataValue(
  value: FormDataEntryValue,
): string | SerializedFile {
  if (value instanceof File) {
    return serializeFile(value);
  }
  return value;
}
