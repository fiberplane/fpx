/**
 * Helper function that truncates large values from keys within a JSON body
 */
export function trimJsonBody(body: unknown): unknown {
  if (typeof body !== "object" || body === null) {
    return body;
  }

  if (Array.isArray(body)) {
    return body.slice(0, 5).concat(["..."], body.slice(-5));
  }

  const trimmedBody: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string" && value.length > 100) {
      trimmedBody[key] = `${value.slice(0, 50)}...${value.slice(-50)}`;
    } else if (typeof value === "object" && value !== null) {
      trimmedBody[key] = trimJsonBody(value);
    } else {
      trimmedBody[key] = value;
    }
  }

  return trimmedBody;
}
