type JsonValue = string | number | boolean | object | null;

export type MizuLog =
  | {
    id: number;
    message: JsonValue;
    createdAt: string;
  }
  | {
    id: number;
    message: string;
    createdAt: string;
    log: unknown;
  };

export const transformToLog = (l: unknown): MizuLog => {
  if (
    l &&
    typeof l === "object" &&
    "id" in l &&
    typeof l.id === "number" &&
    "message" in l &&
    isJsonValue(l.message) &&
    "created_at" in l
    && typeof l.created_at === "string"
  ) {
    return {
      id: l.id,
      message: l.message,
      createdAt: l.created_at,
    };
  }
  return {
    id: +new Date(),
    message: "COULD_NOT_PARSE",
    createdAt: l && typeof l === "object" && "created_at" in l && typeof l.created_at === "string" ? l.created_at : "",
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
