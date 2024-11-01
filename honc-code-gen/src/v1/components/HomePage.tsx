import { html } from "hono/html";
import { useState } from "hono/jsx";
import type { InputEvent } from "hono/jsx";
import { Layout } from "./Layout";

type HomePageProps = {
  nonce: string;
};

export const HomePage = ({ nonce }: HomePageProps) => {
  const [selectedDbType, setSelectedDbType] = useState("d1");

  const handleDbTypeChange = (event: InputEvent) => {
    setSelectedDbType(event.target.value);
  };

  return (
    <Layout>
      <div className="container">
        <form id="hatchForm">
          <div className="form-group">
            <label htmlFor="prompt">Prompt:</label>
            <textarea id="prompt" name="prompt" rows={4} required />
          </div>
          <div className="form-group">
            <label>Database Type:</label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="neon"
                  name="dbType"
                  value="neon"
                  checked={selectedDbType === "neon"}
                  onChange={handleDbTypeChange}
                />
                <label htmlFor="neon">Neon</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="postgres"
                  name="dbType"
                  value="postgres"
                  checked={selectedDbType === "postgres"}
                  onChange={handleDbTypeChange}
                />
                <label htmlFor="postgres">Postgres</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="d1"
                  name="dbType"
                  value="d1"
                  checked={selectedDbType === "d1"}
                  onChange={handleDbTypeChange}
                />
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
            
            let statusContainer = document.getElementById('status-container');
            if (!statusContainer) {
              statusContainer = document.createElement('div');
              statusContainer.id = 'status-container';
              e.target.after(statusContainer);
            } else {
              statusContainer.innerHTML = '';
            }
            
            const formData = new FormData(e.target);
            const prompt = formData.get('prompt');
            const dbType = formData.get('dbType');

            // Add debug message for URL
            const params = new URLSearchParams({
                prompt: prompt,
                dbType: dbType
            });
            const url = "/v1/hatch/123/status?" + params.toString();
            console.log('Connecting to SSE endpoint:', url);

            const eventSource = new EventSource(url);

            // Log when connection is established
            eventSource.onopen = (event) => {
              console.log('SSE Connection opened:', event);
              const div = document.createElement('div');
              div.innerHTML = '<strong>Status:</strong> Connected to server';
              statusContainer.appendChild(div);
            };

            eventSource.addEventListener('status-update', (e) => {
              console.log('Received status-update event:', e);
              let data; 
              try {
                data = JSON.parse(e.data);
              } catch (error) {
                data = e.data;
              }
              const div = document.createElement('div');
              div.innerHTML = '<strong>Status:</strong> ' + (data.message || data);
              statusContainer.appendChild(div);
            });

            // Enhanced error handling
            eventSource.onerror = (error) => {
              console.error('EventSource failed:', error);
              console.log('EventSource readyState:', eventSource.readyState);

              eventSource.close();
              const div = document.createElement('div');
              div.innerHTML = '<strong>Error:</strong> Connection failed (possibly closed by server). Check console for details.';
              div.style.color = 'red';
              statusContainer.appendChild(div);
            };
          });
        </script>
      `}
    </>
  );
}
