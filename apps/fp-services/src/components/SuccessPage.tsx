import { html } from "hono/html";
import { Layout } from "./Layout";

type SuccessPageProps = {
  nonce: string;
  token: string;
  expiresAt: string;
};

export const SuccessPage = ({ nonce, token, expiresAt }: SuccessPageProps) => {
  return (
    <Layout>
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
        <p id="file-bug-message" className="hidden subtle">
          If this feels like a bug, file an issue on{" "}
          <a href="https://github.com/fiberplane/fpx/issues">GitHub</a>
        </p>
      </div>
      <ScriptPostToken token={token} nonce={nonce} expiresAt={expiresAt} />
    </Layout>
  );
};

/**
 * Script to post the token to the locally running auth server
 */
function ScriptPostToken({ token, nonce, expiresAt }: SuccessPageProps) {
  return (
    <>
      {html`
        <script nonce="${nonce}">
          fetch(
            'http://localhost:6174/v0/auth/success',
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
              statusEl.textContent = '🎉 Authenticated';
              statusEl.classList.add('success');
              const successMessageEl = document.getElementById('success-message');
              successMessageEl.classList.remove('hidden');
            })
            .catch(error => {
              console.error("Error:", error);
              const statusEl = document.getElementById('status');
              statusEl.textContent = 'Error';

              statusEl.classList.add('error');
              const errorMessageEl = document.getElementById('error-message');
              errorMessageEl.classList.remove('hidden');
              const fileBugMessageEl = document.getElementById('file-bug-message');
              fileBugMessageEl.classList.remove('hidden');

              if (error.message === 'Failed to fetch') {
                statusEl.textContent = 'Oops!';
                errorMessageEl.textContent = 'Cannot find Studio. Please restart Fiberplane and log in again.';
              } else {
                statusEl.textContent = 'Error: ' + error.message;
                errorMessageEl.textContent = 'An error occurred authenticating with Studio.';
              }
            });
        </script>
      `}
    </>
  );
}
