
<div align="center">
  <h1>Honc Honc!</h1>
  <img src="https://github.com/fiberplane/create-honc-app/blob/9290786147fe1efa2079899064853cf754f175e5/assets/honc.png" width="200" height="200" />
</div>

<p align="center">
    Scaffolding CLI for creating modular data APIs using TypeScript
</p>

<div align="center">
    <code>npm create honc-app@latest</code>
</div

[HONC](https://honc.dev) is a modular collection of choice technologies for building lightweight, type-safe, edge-enabled data apis that scale seamlessly to their demand.

  🪿 **[Hono](https://hono.dev)** as an api framework  
  🪿 **[Neon](https://neon.tech)** for a relational Postgres database  
  🪿 **[Drizzle](https://orm.drizzle.team/)** as the ORM and migrations manager  
  🪿 **[Cloudflare](https://workers.cloudflare.com/)** Workers for deployment hosting  

## Quickstart

To get started run the following command:

```sh
npm create honc-app@latest
```

You'll be prompted a few simple questions, and then a fresh HONC project will arrive in a new directory on your machine.

### Commands

Run the development server:

```sh
npm run dev
```

Once you've set up a Neon database (see below) and added the connection string to a `DATABASE_URL=..` in `dev.vars`, you can generate some migrations, apply them, and seed the database: 

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
```

If you're inclined to deploy the app to the wild wild internet, you can do so as follows (requires a Cloudflare account):

```sh
npm run deploy
```

## Setting up a Neon database

Create a Neon account and project, retrieve the connection key from the dashboard, and add it to your `dev.vars` file.

Alternatively, you can use the Neon CLI to create a project and set the context:

```sh
# Authenticate with neon cli
neonctl auth

# Create project if you haven't already
#
# > *skip this* if you already created a project,
# > and grab the DATABASE_URL from your dashboard
PROJECT_NAME=my-project
neonctl projects create --name $PROJECT_NAME --set-context

# Set project id because the call to `set-context` below needs it
PROJECT_ID=$(neonctl projects list --output=json | jq --arg name "$PROJECT_NAME" '.projects[] | select(.name == $name) | .id')

# Create a `dev` db branch then set context
BRANCH_NAME=dev
neonctl branches create --name=$BRANCH_NAME
neonctl set-context --project-id=$PROJECT_ID --branch=$BRANCH_NAME

# Finally, add connection string to .dev.vars
DATABASE_URL=$(neonctl connection-string)
echo -e '\nDATABASE_URL='$DATABASE_URL'\n' >> .dev.vars
```

This will create a `.neon` file, which is used by the `neonctl` command to know the proper context for running commands. 

This file can be kept in version control. From [the Neon docs](https://neon.tech/docs/reference/cli-set-context):

> **Neon does not save any confidential information to the context file (for example, auth tokens).** You can safely commit this file to your repository or share with others.

## More resources
We have an [awesome HONC list](https://github.com/fiberplane/create-honc-app/blob/main/awesome-honc.md) with further guides, use cases and examples.