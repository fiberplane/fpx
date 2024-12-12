## Lilo

### Getting started

Copy the `.dev.vars.example` file to `.dev.vars` and fill in the values:

```sh
cp .dev.vars.example .dev.vars
```

You'll need GitHub OAuth app credentials for the dashboard. You can create your own or ask for Brett's.

You'll want to initialize the D1 database for your project.

```sh
pnpm db:touch
pnpm db:generate
pnpm db:migrate
```

### (TODO) Project structure

```#
├── src
│   ├── index.ts # Hono app entry point
│   └── db
│       └── schema.ts # Database schema
├── .dev.vars.example # Example .dev.vars file
├── .prod.vars.example # Example .prod.vars file
├── seed.ts # Optional script to seed the db
├── drizzle.config.ts # Drizzle configuration
├── package.json
├── tsconfig.json # TypeScript configuration
└── wrangler.toml # Cloudflare Workers configuration
```

### Commands for local development

Run the development server:

```sh
pnpm dev
```

As you iterate on the database schema, you'll need to generate a new migration file and apply it like so:

```sh
pnpm db:generate
pnpm db:migrate
```

### Commands for deployment

Lilo is already attached to a D1 database. You can find the database id in the `wrangler.toml` file.

If you need to run migrations on the production database, you need to set the following information in a `.prod.vars` file:

```sh
CLOUDFLARE_D1_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_DATABASE_ID=""
```

If you haven’t generated the latest migration files yet, run:
```shell
pnpm db:generate
```

Afterwards, run the migration script for production:
```shell
pnpm db:migrate:prod
```


Finally, deploy 

```shell 
pnpm run deploy
```

#### Setting secrets

Set GitHub OAuth credentials

```sh
pnpx wrangler secret put GITHUB_ID
pnpx wrangler secret put GITHUB_SECRET
```

Set secrets for external api auth

```sh
pnpm keypair:generate:prod
# I prefer to upload the keys as secrets in the wrangler dashboard, since they have newlines
```

Create a session secret

```sh
pnpm session:generate
```



