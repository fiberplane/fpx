import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { html } from "hono/html";
import { streamSSE } from "hono/streaming";

const app = new Hono();

/**
 * Home page
 *
 * A simple page that allows you to start a streaming connection to the /sse endpoint.
 */
app.get("/", (c) => {
  return c.html(
    <html lang="en">
      <body>
        <h1>Server Side Events Example</h1>
        <div className="streaming-container" />
        <button type="button" id="start-streaming">
          Start Streaming
        </button>

        {html`
          <script>
            document.querySelector("#start-streaming").addEventListener("click", () => {
              const eventSource = new EventSource("/sse");
              eventSource.onmessage = (event) => {
                document.querySelector(".streaming-container")?.append(event.data);
              };
            });
          </script>
        `}
      </body>
    </html>,
  );
});

app.get("/sse", async (c) => {
  return streamSSE(c, async (stream) => {
    let id = 0;
    while (true && id < 10) {
      const message = `It is ${new Date().toISOString()}`;
      await stream.writeSSE({
        data: message,
        event: "time-update",
        id: String(id++),
      });
      await stream.sleep(1000);
    }
  });
});

export default instrument(app);
