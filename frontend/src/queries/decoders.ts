type JsonValue = string | number | boolean | object | null;

export type MizuTrace = Array<MizuLog>;

export type MizuLog =
  | {
    id: number;
    traceId: string;
    timestamp: string;
    level: string;
    message: JsonValue;
    args?: JsonValue;
    createdAt: string;
  }
  | {
    id: number;
    traceId: string;
    timestamp: string;
    level: string;
    message: string;
    createdAt: string;
    args?: JsonValue;
    log: unknown;
  };

export const transformToLog = (l: unknown): MizuLog => {
  if (
    l &&
    typeof l === "object" &&
    "id" in l &&
    typeof l.id === "number" &&
    "trace_id" in l && typeof l.trace_id === "string" &&
    "timestamp" in l && typeof l.timestamp === "string" &&
    "level" in l && typeof l.level === "string" &&
    "message" in l &&
    isJsonValue(l.message) &&
    "args" in l &&
    isJsonValue(l.args) &&
    "created_at" in l
    && typeof l.created_at === "string"
  ) {
    return {
      id: l.id,
      traceId: l.trace_id,
      timestamp: l.timestamp,
      level: l.level,
      message: l.message,
      args: l.args,
      createdAt: l.created_at,
    };
  }
  return {
    id: +new Date(),
    traceId: l && typeof l === "object" && "trace_id" in l && typeof l.trace_id === "string" ? l.trace_id : "",
    timestamp: l && typeof l === "object" && "timestamp" in l && typeof l.timestamp === "string" ? l.timestamp : "",
    level: l && typeof l === "object" && "level" in l && typeof l.level === "string" ? l.level : "info",
    message: "COULD_NOT_PARSE",
    createdAt: l && typeof l === "object" && "created_at" in l && typeof l.created_at === "string" ? l.created_at : "",
    args: l && typeof l === "object" && "args" in l && isJsonValue(l.args) ? l.args : null,
    log: l,
  };
};

function isJsonValue(value: unknown): value is JsonValue {
  const type = typeof value;
  return (
    value === null ||
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    (type === "object" && !Array.isArray(value) && value !== null) ||
    Array.isArray(value)
  );
}
