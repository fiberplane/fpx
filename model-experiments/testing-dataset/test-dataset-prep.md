
I searched the hono repo for anything labeled "bug"

## CORS + WebSockets

Issue: https://github.com/honojs/hono/issues/2535



### Reproduction

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