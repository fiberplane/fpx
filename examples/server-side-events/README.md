# Server Side Events Example

This is an example of using Server Side Events (SSE) to stream data to the client.

This app can be used to test 

- Fiberplane's Otel instrumentation of SSE connections.
- Fiberplane Studio's handling of SSE connections in the UI.

To run the example:

```bash
pnpm i
pnpm dev
```

Open the browser and navigate to http://localhost:8787/

Click "Start Streaming", and the stream should run for about 10 seconds.
