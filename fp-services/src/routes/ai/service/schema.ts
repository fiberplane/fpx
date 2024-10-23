import { z } from "zod";

export const requestSchema = z.object({
  path: z.string(),
  pathParams: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .nullable(),
  queryParams: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .nullable(),
  body: z.string().nullable(),
  bodyType: z
    .object({
      type: z.enum(["json", "text", "form-data", "file"]),
      isMultipart: z.boolean(),
    })
    .nullable(),
  headers: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .nullable(),
});
