# mizu

> Japanese for "water"

## Description

This has an api and a frontend that can consume telemetry data from a Hono app. You will need to add specific middleware to you hono app for it to run properly.

The api connects to a Neon database. See configuration steps in [api/README.md](./api/README.md).

The frontend is a React + Typescript + Tailwind app that uses shadcn components. See more info in [frontend/README.md](./api/README.md).

## Setup

### Spinning up the dashboard

1. Create an account with Neon and get a connection string
1. Clone the repo
1. Add `DATABASE_URL=...` to your `.dev.vars` file
1. Spin up the api (follow instructions in README)
1. Check the api is running on `http://localhost:8788`
1. Spin up the frontend (follow instructions in README)
1. Check the frontend is running on `http://localhost:5173`

### Adding to your Hono project

Follow the instructions in the [`client-library` README](./client-library/README.md) to add Mizu telemetry to your Hono project.



