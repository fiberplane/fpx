// ================================================= //
// This file is generated. PLEASE DO NOT MODIFY.     //
// Run `cargo xtask generate-schemas` to regenerate. //
// ================================================= //

import { z } from "zod";

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
          .object({ details: z.any(), type: z.literal("spanAdded") })
          .describe(
            "When a Span has been ingested via the export interface (either gRPC or http), its TraceID and SpanID will be sent through this message. Both ID's will be hex encoded.",
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

export const AppStateSchema = z.object({
  workspace: z.union([z.any(), z.null()]).optional(),
});

export type AppState = z.infer<typeof AppStateSchema>;

export const OpenWorkspaceErrorSchema = z.any().superRefine((x, ctx) => {
  const schemas = [
    z.object({ path: z.string(), type: z.literal("ConfigFileMissing") }),
    z.object({ message: z.string(), type: z.literal("InvalidConfiguration") }),
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
});

export type OpenWorkspaceError = z.infer<typeof OpenWorkspaceErrorSchema>;

export const WorkspaceSchema = z.object({ config: z.any(), path: z.string() });

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const FpxConfigSchema = z.object({
  listen_port: z
    .union([
      z
        .number()
        .int()
        .gte(0)
        .describe("The port on which the API server should listen."),
      z.null().describe("The port on which the API server should listen."),
    ])
    .describe("The port on which the API server should listen.")
    .optional(),
});

export type FpxConfig = z.infer<typeof FpxConfigSchema>;

export const FpxConfigErrorSchema = z.any().superRefine((x, ctx) => {
  const schemas = [
    z.literal("RootDirectoryNotFound"),
    z.object({ FileNotFound: z.string() }).strict(),
    z
      .object({
        InvalidFpxConfig: z.object({
          message: z.string(),
          span: z.union([z.any(), z.null()]).optional(),
        }),
      })
      .strict(),
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
});

export type FpxConfigError = z.infer<typeof FpxConfigErrorSchema>;
