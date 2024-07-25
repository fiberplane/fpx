// ================================================= //
// This file is generated. PLEASE DO NOT MODIFY.     //
// Run `cargo xtask generate-schemas` to regenerate. //
// ================================================= //

import { Ajv } from "ajv";
import { FromSchema } from "json-schema-to-ts";

const ajv = new Ajv();

export const ClientMessageJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ClientMessage",
  description: "Messages that are send from the client to the server.",
  type: "object",
  oneOf: [
    {
      type: "object",
      required: ["type"],
      properties: {
        type: {
          type: "string",
          enum: ["debug"],
        },
      },
      additionalProperties: false,
    },
  ],
  required: ["messageId"],
  properties: {
    messageId: {
      description:
        "A unique identifier for this message. This will be used by certain server messages to refer back to this message, such as Ack or Error.",
      type: "string",
    },
  },
  additionalProperties: false,
} as const;

export const validateClientMessage = ajv.compile(ClientMessageJsonSchema);

export type ClientMessage = FromSchema<typeof ClientMessageJsonSchema>;

export const RequestJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Request",
  description: "A request that has been captured by fpx.",
  type: "object",
  required: ["headers", "id", "method", "url"],
  properties: {
    body: {
      type: ["string", "null"],
    },
    headers: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
    },
    id: {
      type: "integer",
      format: "uint32",
      minimum: 0.0,
    },
    method: {
      type: "string",
    },
    url: {
      type: "string",
    },
  },
  additionalProperties: false,
} as const;

export const validateRequest = ajv.compile(RequestJsonSchema);

export type Request = FromSchema<typeof RequestJsonSchema>;

export const RequestAddedJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RequestAdded",
  type: "object",
  required: ["requestId"],
  properties: {
    inspectorId: {
      description:
        "The id of the inspector that was associated with the request. This is null in the case where the request was send to `/api/inspect`.",
      type: ["integer", "null"],
      format: "int64",
    },
    requestId: {
      description: "The id of the request that has been captured.",
      type: "integer",
      format: "uint32",
      minimum: 0.0,
    },
  },
  additionalProperties: false,
} as const;

export const validateRequestAdded = ajv.compile(RequestAddedJsonSchema);

export type RequestAdded = FromSchema<typeof RequestAddedJsonSchema>;

export const RequestorErrorJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RequestorError",
  oneOf: [],
} as const;

export const validateRequestorError = ajv.compile(RequestorErrorJsonSchema);

export type RequestorError = FromSchema<typeof RequestorErrorJsonSchema>;

export const RequestorRequestPayloadJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "RequestorRequestPayload",
  description:
    "The payload that describes the request that Requestor has to execute",
  type: "object",
  required: ["method", "url"],
  properties: {
    body: {
      type: ["string", "null"],
    },
    headers: {
      type: ["object", "null"],
      additionalProperties: {
        type: "string",
      },
    },
    method: {
      type: "string",
    },
    url: {
      type: "string",
    },
  },
  additionalProperties: false,
} as const;

export const validateRequestorRequestPayload = ajv.compile(
  RequestorRequestPayloadJsonSchema,
);

export type RequestorRequestPayload = FromSchema<
  typeof RequestorRequestPayloadJsonSchema
>;

export const ServerMessageJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ServerMessage",
  description: "Messages that are send from the server to the client.",
  type: "object",
  oneOf: [
    {
      description:
        "A message was received and processed successfully. See the outer message for the message id.",
      type: "object",
      required: ["type"],
      properties: {
        type: {
          type: "string",
          enum: ["ack"],
        },
      },
      additionalProperties: false,
    },
    {
      description:
        "An error occurred on the server. This could be caused by a message or could be caused by something else. See the outer message for the message id.",
      type: "object",
      required: ["details", "type"],
      properties: {
        details: {
          $ref: "#/definitions/ServerError",
        },
        type: {
          type: "string",
          enum: ["error"],
        },
      },
      additionalProperties: false,
    },
    {
      description:
        "A request has been captured. It contains a reference to the request id and optionally a reference to the inspector id.",
      type: "object",
      required: ["details", "type"],
      properties: {
        details: {
          $ref: "#/definitions/RequestAdded",
        },
        type: {
          type: "string",
          enum: ["requestAdded"],
        },
      },
      additionalProperties: false,
    },
    {
      description:
        "When a Span has been ingested via the export interface (either gRPC or http), its TraceID and SpanID will be sent through this message. Both ID's will be hex encoded.",
      type: "object",
      required: ["details", "type"],
      properties: {
        details: {
          $ref: "#/definitions/SpanAdded",
        },
        type: {
          type: "string",
          enum: ["spanAdded"],
        },
      },
      additionalProperties: false,
    },
  ],
  properties: {
    messageId: {
      description:
        "If this is a response to a client message, then this field contains the same message id. Otherwise it will be [`None`].",
      type: ["string", "null"],
    },
  },
  additionalProperties: false,
  definitions: {
    RequestAdded: {
      type: "object",
      required: ["requestId"],
      properties: {
        inspectorId: {
          description:
            "The id of the inspector that was associated with the request. This is null in the case where the request was send to `/api/inspect`.",
          type: ["integer", "null"],
          format: "int64",
        },
        requestId: {
          description: "The id of the request that has been captured.",
          type: "integer",
          format: "uint32",
          minimum: 0.0,
        },
      },
      additionalProperties: false,
    },
    ServerError: {
      oneOf: [
        {
          description: "A message was received that could not be parsed.",
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "string",
              enum: ["invalidMessage"],
            },
          },
          additionalProperties: false,
        },
      ],
    },
    SpanAdded: {
      type: "object",
      required: ["newSpans"],
      properties: {
        newSpans: {
          description:
            "New spans that have been added. The key is the trace ID and the values are the spans ID's for that specific trace. Both trace and span ID are hex encoded.",
          type: "array",
          items: {
            type: "array",
            items: [
              {
                type: "string",
              },
              {
                type: "string",
              },
            ],
            maxItems: 2,
            minItems: 2,
          },
        },
      },
    },
  },
} as const;

export const validateServerMessage = ajv.compile(ServerMessageJsonSchema);

export type ServerMessage = FromSchema<typeof ServerMessageJsonSchema>;
