import { Hono } from "hono";

// Using Record<string, unknown> as a simpler type for JSON data
type ApiResponse = Record<string, unknown> | Array<Record<string, unknown>>;

export default function createTracesApiRoute(fpxEndpoint?: string) {
  const app = new Hono();

  app.get("/", async (c) => {
    if (!fpxEndpoint) {
      return c.json({ error: "Tracing is not enabled" }, 500);
    }
    try {
      const fpxBaseUrl = new URL(fpxEndpoint).origin;
      const response = await fetch(`${fpxBaseUrl}/v1/traces${c.req.query()}`);
      const data = (await response.json()) as ApiResponse;
      return c.json(data);
    } catch (error) {
      console.error("Failed to fetch traces:", error);
      return c.json({ error: "Failed to fetch traces" }, 500);
    }
  });

  app.get("/:traceId/spans", async (c) => {
    if (!fpxEndpoint) {
      return c.json({ error: "Tracing is not enabled" }, 500);
    }
    try {
      const fpxBaseUrl = new URL(fpxEndpoint).origin;
      const traceId = c.req.param("traceId");
      const response = await fetch(
        `${fpxBaseUrl}/v1/traces/${traceId}/spans${c.req.query()}`,
      );
      const data = (await response.json()) as ApiResponse;
      return c.json(data);
    } catch (error) {
      console.error("Failed to fetch spans:", error);
      return c.json({ error: "Failed to fetch spans" }, 500);
    }
  });

  return app;
}
