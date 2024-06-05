# 💧 mizu (水)

> Japanese for "water"

## Description

This has an api and a frontend that can consume telemetry data from a Hono app. 

To connect your Hono app to the api, you'll need to add the code in the [`client-library`](./client-library) folder to your Hono app. This will send telemetry data to the api.

Worth noting is that the api connects to a local libsql (sqlite) database. Setup steps for this are simple (just need to run migrations), and are in [api/README.md](./api/README.md).

The frontend is a React + Typescript + Tailwind app that uses [shadcn/ui](https://ui.shadcn.com/) components. For more info on the frontend, see: [frontend/README.md](./frontend/README.md).

## Setup

You'll want to 

1. Run the code in this repo, and then 
2. Add some client code to a Hono app

The next two sections take you through how to do this.

### Spinning up the database, api, and dashboard

1. Clone this repo
1. `cd api` and spin up the api (follow instructions in [api/README](./api/README.md))
1. Check the api is running on `http://localhost:8788`
1. `cd frontend` in a separate shell, and spin up the frontend (follow instructions in in [frontend/README](./frontend/README.md))
1. Check the frontend is running on `http://localhost:5173`

### Adding Mizu to your Hono project

Follow the instructions in the [`client-library` README](./client-library/README.md) to add Mizu telemetry to your Hono project.

## Developing

This project uses biome and npm monorepos.

In the project root you can format all codebases with `npm run format`.

You will also want to use the project root to prepare the npx command for the distributable API. See the root's `package.json` scripts, as well as the api's README for more details on testing the npx command.