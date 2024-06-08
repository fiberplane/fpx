
I searched the hono repo for anything labeled "bug"

## Error Using WebSocket Helper for Cloudflare Workers (4.4.2)

Issue: https://github.com/honojs/hono/issues/2883

Error: `RangeError: Responses with a WebSocket must have status code 101.`

```ts
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'

const app = new Hono()

app.get(
	'/ws',
	upgradeWebSocket((c) => {
		return {
			onMessage(event, ws) {
				console.log(`Message from client: ${event.data}`)
				ws.send('Hello from server!')
			},
			onClose: () => {
				console.log('Connection closed')
			},
		}
	}),
)

export default app
```

## JSX without fragment: html isEscaped TypeError

Issue: https://github.com/honojs/hono/issues/2194

Error: TypeError: Cannot read properties of null (reading 'isEscaped')

### Repro

```ts
app.post('/upload', async (c) => {
  const body = await c.req.parseBody<{ file: File | File[] }>({ all: true })
  const files = Array.isArray(body['file']) ? body['file'] : [body['file']]

  if (files.length === 0) {
    c.status(400)
    return c.json({ error: 'No files' })
  }

  return c.json({ fileNames: files.map((file) => file.name) })
})
```


## Cookie Max Age

Issue: https://github.com/honojs/hono/issues/2762

Mizu Log Message:

```json
{
    // ...
    "message": {
        "name": "Error",
        "message": "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.",
        "stack": "Error: Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.\n    at _serialize (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:2051:13)\n    at serialize (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:2090:10)\n    at setCookie (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:2106:14)\n    at file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:2118:3\n    at dispatch (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:307:23)\n    at file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:308:20\n    at log (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:1874:9)\n    at honoMiddleware (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:2022:13)\n    at dispatch (file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:307:23)\n    at file:///Users/brettbeutell/fiber/la/.wrangler/tmp/dev-f6He74/index.js:284:12"
    },
  // ...
}
```

## Parsing body with `all:true` ((4.3.3-4.3.5))

Issue: https://github.com/honojs/hono/issues/2664

## HTTPException status ignore ((4.3.7))

Issue: https://github.com/honojs/hono/issues/2707

Possibly Deno only? 

## CORS + WebSockets ((DENO ONLY))

Issue: https://github.com/honojs/hono/issues/2535

### Reproduction ((DENO ONLY))

```ts

app.use('*', cors())

app.get('/monitor-web-socket', upgradeWebSocket((c) => {
  return {
    onMessage(event, ws) {
      ws.send(`[MESSAGE] ${event.data.toString()}`)
    },
    onClose: () => {
      console.log('Connection closed')
    },
  }
}))

app.get('/monitor-web-socket-test', c => {
  return c.html(
    <html lang="en">
      <div>
        hi
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
      <script dangerouslySetInnerHTML={{
        __html: `
          const ws = new WebSocket(\`ws://\${window.location.host}/monitor-web-socket\`);
          ws.onmessage = (event) => {
            console.log(event.data);
          };
          ws.onclose = () => {
            console.log('Connection closed');
          };
        `
      }}/>
    </html>
  )
})
```

## Fetch Headers not Sent ((Otel-fetch-node specific))

Issue: https://github.com/honojs/hono/issues/2842

## DotEnv - basic but salient

Issue: https://github.com/honojs/hono/issues/2919

Error: Fails to compile :(