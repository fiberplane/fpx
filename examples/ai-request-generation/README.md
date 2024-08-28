# Request Parameter Generation with Hermes 

This example shows how to use a Cloudflare Workers AI model that supports function calling in order to generate request parameters for a Hono route. It uses the [Hermes](https://huggingface.co/nousresearch/hermes-2-pro-mistral-7b) model, which is a Mistral-based model that supports function calling.

Fiberplane Studio is used to add timing information to the request. Instrumentation of the Cloudflare `AI` binding should happen automagically.

## Running Locally

You will need a Cloudflare account in order to run this locally, since AI inference is billed.

```sh
pnpm i
pnpm dev
```

Then, you can inspect the request and response in Fiberplane Studio.

```sh
npx @fiberplane/studio
```

Test one of the following JSON request bodies against the `POST /` route, and you'll see structured output describing a sample HTTP request.

You can adjust query parameters like `temperature` in the request query params.

```json
{
  "prompt": "GET /users/:id"
}
```

```json
{
  "prompt": "GET /users/:id"
}
```