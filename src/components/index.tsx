import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  )
}

export const Messages = ({ logs }: { logs: unknown[] }) => {
  const validatedLogs = logs.map(l => {
    if (l && typeof l === "object" && "id" in l && "message" in l && isJsonValue(l.message)) {
      return {
        id: l.id,
        // NOTE - This fails if l.message was a string... maybe neon sql automatically parses it?
        message: l.message
      };
    }
    return {
      id: +(new Date()),
      message: "COULD_NOT_PARSE",
      log: l,
    }
  })
  return (
    <Layout>
      <h1>Messages</h1>
      <div>
        <h2>Recent Logs</h2>
        <ul>
          {validatedLogs.map((log) => (
            <li key={log.id}>
              <pre>{typeof log.message === "string" ? log.message : JSON.stringify(log.message, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

function isJsonValue(value: unknown): value is string | number | boolean | object | null {
  if (value === null) {
    return false;  // JSON can be null but let's assume we want to handle non-null JSON only
  }

  const type = typeof value;
  return value === null || type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    (type === 'object' && !Array.isArray(value) && value !== null) ||  // Check for object (not an array or null)
    Array.isArray(value);  // Arrays are valid JSON types
}
