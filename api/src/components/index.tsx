import type { FC } from "hono/jsx";

export const Layout: FC = (props) => {
  return (
    <html lang="en">
      <head>
        <style>
          {`
            body { font-family: Arial, sans-serif; }
            .log-entry { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }
            .properties { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
            .property { background: #f2f2f2; padding: 10px; border: 1px solid #ddd; max-height: 100px; overflow: auto; }
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
      {validatedLogs.map((log) => (
        <div key={log.id} className="log-entry">
          {log.message?.lifecycle === "simple" || typeof log.message === "string" ? (
            <div>{log.message}</div>
          ) : (
            <div className="properties">
              
              {Object.entries(log.message).map(([key, value]) => (
                <div key={key} className="property">
                  <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value, null, 2) : value.toString()}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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