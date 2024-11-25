# D1 — what's going on here?

D1 is Cloudflare's relational database. It's basically sqlite!

Working with HONC + D1 locally is a little peculiar. We've done as best as goosily possible to make it easy for you, but you'll see some eye-raising funkiness if you look at the migration and seed scripts :goose:.

Visit https://developers.cloudflare.com/d1/ for more information

## Local development

Wrangler spins up a local D1 database for you to work with.

You don't really have to worry about this too much, though, because the `db:setup` command will try to take care of everything for you.

When you run `npm run db:setup`, it runs the following commands:

```sh
npm run db:touch
npm run db:generate
npm run db:migrate
npm run db:seed
```

This is how it works

- runs `db:touch` to make sure the local database exists
- runs `db:generate` to create the database migration _files_
- runs `db:migrate` to apply the migration files (run them) on the local database
- runs `db:seed` to seed the local database with some data


## Production

Create a Cloudflare account and D1 instance, retrieve the database key and your account id from the dashboard and addionally create an API token with D1 edit rights, and add it to your .prod.vars file.

```sh
CLOUDFLARE_D1_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_DATABASE_ID=""
```

(This is also covered in the README.md file.)

Then run `npm run db:migrate:prod` to apply the migrations to the production database.