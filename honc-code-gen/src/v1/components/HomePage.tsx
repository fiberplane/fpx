import { html } from "hono/html";
import { Layout } from "./Layout";

type HomePageProps = {
  nonce: string;
};

export const HomePage = ({ nonce }: HomePageProps) => {
  return (
    <Layout>
      <div className="container">
        <form id="hatchForm">
          <div className="form-group">
            <label htmlFor="prompt">Prompt:</label>
            <textarea id="prompt" name="prompt" rows={4} required/>
          </div>
          <div className="form-group">
            <label>Database Type:</label>
            <div className="radio-group">
              <div className="radio-option">
                <input type="radio" id="neon" name="dbType" value="neon" required />
                <label htmlFor="neon">Neon</label>
              </div>
              <div className="radio-option">
                <input type="radio" id="postgres" name="dbType" value="postgres" />
                <label htmlFor="postgres">Postgres</label>
              </div>
              <div className="radio-option">
                <input type="radio" id="d1" name="dbType" value="d1" />
                <label htmlFor="d1">D1 (SQLite)</label>
              </div>
            </div>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
      <ScriptSubmitForm nonce={nonce} />
    </Layout>
  );
};

/**
 * Script to submit the form to the Hatch Honc App api
 */
function ScriptSubmitForm({ nonce }: { nonce: string }) {
  return (
    <>
      {html`
        <script nonce="${nonce}">
          document.getElementById('hatchForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
              prompt: formData.get('prompt'),
              dbType: formData.get('dbType')
            };

            fetch('/v1/hatch', {
              method: "POST",
              body: JSON.stringify(data),
              headers: {
                'Content-Type': 'application/json'
              },
            })
            .then(async response => {
              if (!response.ok) {
                throw new Error("HTTP error! status: " + response.status);
              }
              return response.text();
            })
            .then(data => {
              console.log("Success:", data);
              window.alert('Success: ' + data);
            })
            .catch(error => {
              console.error("Error:", error);
              window.alert('Error: ' + error.message);
            });
          });
        </script>
      `}
    </>
  );
}
