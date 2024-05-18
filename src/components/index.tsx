import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <style>
          {`
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          `}
        </style>
      </head>
      <body>{props.children}</body>
    </html>
  )
}

export const Messages = ({ logs }: { logs: unknown[] }) => {
  const validatedLogs = logs.map(l => {
    if (l && typeof l === "object" && "id" in l && "message" in l && isJsonValue(l.message)) {
      return {
        id: l.id,
        message: l.message
      };
    }
    return {
      id: +(new Date()),
      message: "COULD_NOT_PARSE",
      log: l,
    }
  });

  return (
    <Layout>
      <h1>Messages</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {validatedLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>
                <pre>{typeof log.message === "string" ? log.message : JSON.stringify(log.message, null, 2)}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
};

function isJsonValue(value: unknown): value is string | number | boolean | object | null {
  const type = typeof value;
  return value === null || type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    (type === 'object' && !Array.isArray(value) && value !== null) ||
    Array.isArray(value);
}