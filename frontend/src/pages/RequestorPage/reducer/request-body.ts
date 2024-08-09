import { z } from "zod";
import { FormDataParameterSchema } from "../FormDataForm";

const RequestorBodyJsonTypeSchema = z.literal("json");
const RequestorBodyTextTypeSchema = z.literal("text");
const RequestorBodyFormDataTypeSchema = z.literal("form-data");
const RequestorBodyFileTypeSchema = z.literal("file");

const RequestorBodyTypeSchema = z.union([
  RequestorBodyJsonTypeSchema,
  RequestorBodyTextTypeSchema,
  RequestorBodyFormDataTypeSchema,
  RequestorBodyFileTypeSchema,
]);

type RequestorBodyType = z.infer<typeof RequestorBodyTypeSchema>;

export const isRequestorBodyType = (
  bodyType: unknown,
): bodyType is RequestorBodyType =>
  RequestorBodyTypeSchema.safeParse(bodyType).success;

export const RequestorBodySchema = z.union([
  z.object({
    type: RequestorBodyTextTypeSchema,
    value: z.string().optional(),
  }),
  z.object({
    type: RequestorBodyJsonTypeSchema,
    value: z.string().optional(),
  }),
  z.object({
    type: RequestorBodyFormDataTypeSchema,
    isMultipart: z.boolean(),
    value: z.array(FormDataParameterSchema),
  }),
  z.object({
    type: RequestorBodyFileTypeSchema,
    value: z.instanceof(File).optional(),
  }),
]);
