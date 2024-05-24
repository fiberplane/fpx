# 💧 mizu (水)

> Japanese for "water"

## Description

This has an api and a frontend that can consume telemetry data from a Hono app. 

To connect your Hono app to the api, you'll need to add the code in the [`client-library`](./client-library) folder to your Hono app. This will send telemetry data to the api.

Worth noting is that the api connects to a Neon (postgres) database. There are setup and configuration steps for this in [api/README.md](./api/README.md).

The frontend is a React + Typescript + Tailwind app that uses [shadcn/ui](https://ui.shadcn.com/) components. For more info on the frontend, see: [frontend/README.md](./frontend/README.md).

## Setup

You'll want to run the code in this repo, and then add some client code to your Hono app.

### Spinning up the database, api, and dashboard

1. Clone this repo
1. Create an account with [Neon](https://neon.tech/)
1. Install the [Neon CLI](https://neon.tech/docs/reference/neon-cli)
1. Spin up the api (follow instructions in [api/README](./api/README.md))
1. Check the api is running on `http://localhost:8788`
1. Spin up the frontend (follow instructions in in [frontend/README](./frontend/README.md))
1. Check the frontend is running on `http://localhost:5173`

### Adding Mizu to your Hono project

Follow the instructions in the [`client-library` README](./client-library/README.md) to add Mizu telemetry to your Hono project.
