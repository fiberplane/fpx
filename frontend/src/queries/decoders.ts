type JsonValue = string | number | boolean | object | null;

export type MizuLog =
  | {
    id: number;
    level: string;
    message: JsonValue;
    args?: JsonValue;
    createdAt: string;
  }
  | {
    id: number;
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
      level: l.level,
      message: l.message,
      args: l.args,
      createdAt: l.created_at,
    };
  }
  return {
    id: +new Date(),
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
