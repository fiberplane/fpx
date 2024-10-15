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
    .optional(),
  queryParams: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  body: z.string().optional(),
  bodyType: z
    .object({
      type: z.enum(["json", "text", "form-data", "file"]),
      isMultipart: z.boolean(),
    })
    .optional(),
  headers: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

export const makeRequestTool = {
  type: "function",
  function: {
    name: "make_request",
    description:
      "Generates some random data for an http request to an api backend",
    parameters: requestSchema,
  },
};
