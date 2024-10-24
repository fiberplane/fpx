# Fiberplane Studio Services

Makes use of GitHub OAuth and JWT-based authentication using Hono, Drizzle ORM, and Cloudflare Workers.

## Features

- GitHub OAuth authentication
- User management with SQLite database (using Cloudflare D1)
- JWT token generation and verification
- RSA key pair generation and management
- Scheduled job to refresh AI credits for all users on the daily

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


#### Testing the Scheduled Job

You need to launch wrangler with a special flag to test scheduled jobs. 
Then you can hit the endpoint manually with curl.

- `pnpm dev:cron`
- `curl "http://localhost:3578/__scheduled?cron=*+*+*+*+*"`

## API Endpoints

- `GET /github`: GitHub OAuth callback endpoint
- `GET /user`: Endpoint to verify JWT tokens and return the user
- `POST /ai/request`: AI Request Generation

## Deployment

Deploy the app to Cloudflare Workers using the following command:

```sh
pnpm run deploy
```

### Setting up Secrets

Generate a new key pair if you must:

```sh
pnpx keypair:generate
```

Set the secrets from the commandline (although I preferred to set the keys in the Dashboard):

```sh
pnpx wrangler secret put OPENAI_API_KEY
pnpx wrangler secret put GITHUB_ID
pnpx wrangler secret put GITHUB_SECRET
pnpx wrangler secret put PUBLIC_KEY
pnpx wrangler secret put PRIVATE_KEY
```

### Migrating the Database

Copy the production environment variables examples

```sh
cp .prod.vars.example .prod.vars
```

Fill in the variables.

Run the migrations:

```sh
pnpm db:migrate:prod
```

## Project Structure

- `src/index.tsx`: Main api file with route handlers and core logic
- `src/lib/crypto.ts`: Cryptographic functions for key generation and imports
- `src/db/index.ts`: Database initialization and connection
- `src/db/schema.ts`: Database schema definition using Drizzle ORM

## License

[MIT License](LICENSE)
