# Webhonc

Webhonc is a simple service running on Durable Objects. It's designed to handle a WebSocket connection to a local FPX  and relay requests from the scary internet back to FPX, which can in turn make requests to a local Hono service.

## Development

To start the development server:

```sh
npm install
npm run dev
```

This will start the server on the port specified in the `wrangler.toml` file (default is 3000).

To use the local version with the fpx api, you can set the `FPX_WEBHONC_BASE_URL` environment variable to `http://localhost:3000` for the api.

## Deployment

To deploy the service, run the following command:

```sh
npm run deploy
```