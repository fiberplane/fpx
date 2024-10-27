# Server Side Events Example

This is an example of using Server Side Events (SSE) to stream data to the client.

It's meant for testing the issue described in https://github.com/fiberplane/fpx/issues/339

To run the example:

```bash
pnpm i
pnpm dev
```

Open the browser and navigate to http://localhost:8787/

Click "Start Streaming" and you should see an error.

Remove `instrument(app)` in `src/index.tsx` and try again. You should no longer see an error.


> **TODO** Update the README once this issue is resolved.