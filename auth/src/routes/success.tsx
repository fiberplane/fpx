import { Hono } from "hono";

const app = new Hono();

// HACK - I could not figure out the type for `children`
export const SuccessPage = (props: { nonce: string; token: string }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fiberplane Studio Auth</title>
        <style>{`
          body {
            font-family: sans-serif;
            color: hsl(210, 40%, 98%);
            background-color: hsl(222.2, 84%, 4.9%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            background-color: hsl(222.2, 84%, 4.9%);
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            text-align: center;
          }
          #status {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .loading {
            font-family: sans-serif;
            color: hsl(215, 20.2%, 65.1%);
          }
          .success {
            font-family: sans-serif;
            color: hsl(142, 76%, 36%);
          }
          .error {
            font-family: sans-serif;
            color: hsl(0, 62.8%, 50.6%);
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div id="status" className="loading">
            Loading...
          </div>
          <p>Token: {props.token}</p>
        </div>
        <script
          nonce={props.nonce}
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: Need to hackily execute script */
          dangerouslySetInnerHTML={{
            __html: `
          fetch(
            'http://localhost:3579/v0/auth/success',
            {
              mode: "cors",
              method: "POST",
              body: JSON.stringify({ token: "${props.token}" }),
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
            .then(async response => {
              if (!response.ok) {
                console.error("Error sending token", JSON.stringify({ token: "${props.token}" }))
                try {
                  console.log("error response body:", await response.text())
                } catch {
                 console.error("could not parse error response body")
                }
                throw new Error(\`HTTP error! status: \${response.status}\`);
              }
              return response.text();
            })
            .then(data => {
              console.log("Success:", data);
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Success';
              statusEl.className = 'success';
            })
            .catch(error => {
              console.error("Error:", error);
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Error: ' + error.message;
              statusEl.className = 'error';
            });
        `,
          }}
        />
      </body>
    </html>
  );
};

app.get("/test", async (c) => {
  const token = "abc123";

  const nonce = generateNonce(); // Generate a unique nonce for each request

  // Set CSP header
  c.header("Content-Security-Policy", `script-src 'nonce-${nonce}'`);

  return c.render(<SuccessPage nonce={nonce} token={token} />);
});

export default app;

export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // @ts-expect-error - works in practice
  return btoa(String.fromCharCode.apply(null, array));
}
