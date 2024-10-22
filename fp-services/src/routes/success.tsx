import { Hono } from "hono";
import { Style, css } from "hono/css";
import { html } from "hono/html";

const app = new Hono();

type SuccessPageProps = {
  nonce: string;
  token: string;
  expiresAt: string;
};

// NOTE - I could not figure out the proper type for `children` on a JSX element.
//        (Hono docs uses `any` for `children`)
//        So we are using one big page component for now.
export const SuccessPage = ({ nonce, token, expiresAt }: SuccessPageProps) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Fiberplane Studio Auth</title>
        <Style>{css`
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
            padding: 2rem;
            text-align: center;
            margin-bottom: 10%;
          }
          .hidden {
            display: none;
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
          .status {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .hidden {
            display: none;
          }
        `}</Style>
      </head>
      <body>
        <div className="container">
          <div id="status" className="status loading">
            Loading...
          </div>
          <p id="success-message" className="hidden">
            You can close this page and return to Studio.
          </p>
          <p id="error-message" className="hidden">
            An error occurred authenticating with Studio.
          </p>
        </div>
        <ScriptPostToken token={token} nonce={nonce} expiresAt={expiresAt} />
      </body>
    </html>
  );
};

app.get("/test", async (c) => {
  const token = `test-${crypto.randomUUID()}`;
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  // Generate a unique nonce for each request
  const nonce = generateNonce();

  // Set CSP header
  c.header("Content-Security-Policy", `script-src 'nonce-${nonce}'`);

  return c.render(
    <SuccessPage nonce={nonce} token={token} expiresAt={expiresAt} />,
  );
});

export default app;

export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // @ts-expect-error - works in practice
  return btoa(String.fromCharCode.apply(null, array));
}

function ScriptPostToken({ token, nonce, expiresAt }: SuccessPageProps) {
  return (
    <>
      {html`
        <script nonce="${nonce}">
          fetch(
            'http://localhost:3579/v0/auth/success',
            {
              mode: "cors",
              method: "POST",
              body: JSON.stringify({ token: "${token}", expiresAt: "${expiresAt}" }),
              headers: {
                'Content-Type': 'application/json'
              },
            }
          )
            .then(async response => {
              if (!response.ok) {
                console.error("Error sending token", JSON.stringify({ token: "${token}" }))
                try {
                  console.log("error response from api, body:", await response.text())
                } catch {
                  console.error("could not parse error response body")
                }
                throw new Error("HTTP error! status: " + response.status);
              }
              return response.text();
            })
            .then(data => {
              console.log("Success:", data);
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Authenticated';
              statusEl.classList.add('success');
              const successMessageEl = document.getElementById('success-message');
              successMessageEl.classList.remove('hidden');
            })
            .catch(error => {
              console.error("Error:", error);
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Error: ' + error.message;
              statusEl.classList.add('error');
            });
        </script>
      `}
    </>
  );
}
