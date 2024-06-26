// ================================================= //
// This file is generated. PLEASE DO NOT MODIFY.     //
// Run `cargo xtask generate-schemas` to regenerate. //
// ================================================= //

import { z } from "zod";

export const RequestorRequestPayloadSchema = z
  .object({
    body: z.union([z.string(), z.null()]).optional(),
    headers: z.union([z.record(z.string()), z.null()]).optional(),
    method: z.string(),
    url: z.string(),
  })
  .describe(
    "The payload that describes the request that Requestor has to execute",
  );

export type RequestorRequestPayload = z.infer<
  typeof RequestorRequestPayloadSchema
>;

export const ClientMessageSchema = z
  .object({
    messageId: z
      .string()
      .describe(
        "A unique identifier for this message. This will be used by certain server messages to refer back to this message, such as Ack or Error.",
      ),
  })
  .and(z.object({ type: z.literal("debug") }))
  .describe("Messages that are send from the client to the server.");

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const RequestSchema = z
  .object({
    body: z.union([z.string(), z.null()]).optional(),
    headers: z.record(z.string()),
    id: z.number().int().gte(0),
    method: z.string(),
    url: z.string(),
  })
  .describe("A request that has been captured by fpx.");

export type Request = z.infer<typeof RequestSchema>;

export const RequestAddedSchema = z.object({
  inspectorId: z
    .union([
      z
        .number()
        .int()
        .describe(
          "The id of the inspector that was associated with the request. This is null in the case where the request was send to `/api/inspect`.",
        ),
      z
        .null()
        .describe(
          "The id of the inspector that was associated with the request. This is null in the case where the request was send to `/api/inspect`.",
        ),
    ])
    .describe(
      "The id of the inspector that was associated with the request. This is null in the case where the request was send to `/api/inspect`.",
    )
    .optional(),
  requestId: z
    .number()
    .int()
    .gte(0)
    .describe("The id of the request that has been captured."),
});

export type RequestAdded = z.infer<typeof RequestAddedSchema>;

export const ServerMessageSchema = z
  .object({
    messageId: z
      .union([
        z
          .string()
          .describe(
            "If this is a response to a client message, then this field contains the same message id. Otherwise it will be [`None`].",
          ),
        z
          .null()
          .describe(
            "If this is a response to a client message, then this field contains the same message id. Otherwise it will be [`None`].",
          ),
      ])
      .describe(
        "If this is a response to a client message, then this field contains the same message id. Otherwise it will be [`None`].",
      )
      .optional(),
  })
  .and(
    z.any().superRefine((x, ctx) => {
      const schemas = [
        z
          .object({ type: z.literal("ack") })
          .describe(
            "A message was received and processed successfully. See the outer message for the message id.",
          ),
        z
          .object({ details: z.any(), type: z.literal("error") })
          .describe(
            "An error occurred on the server. This could be caused by a message or could be caused by something else. See the outer message for the message id.",
          ),
        z
          .object({ details: z.any(), type: z.literal("requestAdded") })
          .describe(
            "A request has been captured. It contains a reference to the request id and optionally a reference to the inspector id.",
          ),
      ];
      const errors = schemas.reduce<z.ZodError[]>(
        (errors, schema) =>
          ((result) => (result.error ? [...errors, result.error] : errors))(
            schema.safeParse(x),
          ),
        [],
      );
      if (schemas.length - errors.length !== 1) {
        ctx.addIssue({
          path: ctx.path,
          code: "invalid_union",
          unionErrors: errors,
          message: "Invalid input: Should pass single schema",
        });
      }
    }),
  )
  .describe("Messages that are send from the server to the client.");

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
