# Server Side Events Example

This is a minimal example of using Server Side Events (SSE) to stream data from a Hono api to a client in the browser.

This app can be used to test the following:

- Fiberplane's Otel instrumentation of SSE connections.
- Fiberplane Studio's handling of SSE connections in the UI.

To run the example:

```bash
pnpm i
pnpm dev
```

Open the browser and navigate to http://localhost:8787/

Click "Start Streaming", and the stream should run for about 10 seconds, producing a new message every second.

That's it!