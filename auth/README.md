# Fiberplane Studio Services

Makes use of GitHub OAuth and JWT-based authentication using Hono, Drizzle ORM, and Cloudflare Workers.

## Features

- GitHub OAuth authentication
- User management with SQLite database (using Cloudflare D1)
- JWT token generation and verification
- RSA key pair generation and management

## Prerequisites

- Node.js
- pnpm
- Cloudflare account with Workers and D1
- GitHub OAuth App credentials

## Setup

1. Install dependencies:
   ```sh
   pnpm install
   ```

2. Set up environment variables:
   Create a `.dev.vars` file in the root directory with the following variables:
   ```
   GITHUB_ID=<your-github-oauth-app-client-id>
   GITHUB_SECRET=<your-github-oauth-app-client-secret>
   PUBLIC_KEY=<your-local-public-key>
   PRIVATE_KEY=<your-local-private-key>
   ```

3. Generate RSA key pair:
   Use `pnpm keypair:generate` endpoint to generate a new RSA key pair. Save the public and private keys in your Cloudflare Worker's environment variables as `PUBLIC_KEY` and `PRIVATE_KEY` respectively.

4. Set up Cloudflare D1 database: 
   Locally, you need to run `pnpm db:touch`

## Running Locally

1. Start the development server:
   ```sh
   pnpm db:touch
   pnpm db:migrate
   pnpm run dev
   ```

2. The app will be available at `http://localhost:3578`

### Testing

- [Configure a GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) on your personal account, and grab the client id and secret. Put these in `.dev.vars`
  * Use `http://127.0.0.1:3578/github` as the callback.

- Launch the api in the repo with `pnpm dev`

- Hit the URL: `http://127.0.0.1:3578/github`
  * **USE `127.0.0.1` as the host**, do NOT use `localhost`. The hono GitHub OAuth middleware sets a cookie in order to verify the response.

- Log in with GitHub

## API Endpoints

- `/github`: GitHub OAuth callback endpoint
- `/verify`: Endpoint to verify JWT tokens and generate new RSA key pairs

## Deployment

Deploy the app to Cloudflare Workers using the following command:

```sh
pnpm run deploy
```

Make sure to set up the necessary environment variables and bindings in your Cloudflare Worker's configuration.

## Project Structure

- `src/index.ts`: Main application file with route handlers and core logic
- `src/crypto.ts`: Cryptographic functions for key generation and import
- `src/db/index.ts`: Database initialization and connection
- `src/db/schema.ts`: Database schema definition using Drizzle ORM

## License

[MIT License](LICENSE)
