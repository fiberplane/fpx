# Lilo

This is a dashboard + external API for "Lilo" - a tool for generating API testing workflows from user stories.

There's more info in each of the `README.md` files in the `lilo-worker` and `lilo-frontend` directories.

For the record:

- `lilo-worker` is the backend, and it has both an internal API and an external API
- `lilo-frontend` is the dashboard that talks to the internal API, and links to the external API reference (powered by Scalar)

The frontend also imports `hono/client` to talk to the internal API. It also needs to import some types from `lilo-worker`, but it does so in kind of a janky way because I'm not great at configuring separate typescript projects to talk to each other.

## Setup

Run the backend:
```bash
cd lilo-worker
# follow setup instructions
pnpm dev
```

Run the frontend:
```bash
cd lilo-frontend
pnpm dev
```