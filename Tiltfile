# Automagically install & update pnpm dependencies when package.json changes
local_resource(
    "node_modules",
    labels=["api", "studio"],
    deps=["package.json", "api/package.json", "studio/package.json"],
    dir=".",
    cmd="pnpm install",
)

# Ensure the api/dist directory exists
local_resource(
    "api-dist",
    labels=["api"],
    cmd="mkdir api/dist || true",
)

local_resource(
    "packages-build",
    labels=["studio"],
    cmd="pnpm --filter @fiberplane/fpx-types build && pnpm --filter @fiberplane/fpx-utils build && pnpm --filter @fiberplane/hono-otel build",
    deps=["packages"],
    ignore=["packages/*/dist"],
)

# Build & serve the studio
local_resource(
    "studio-build",
    labels=["studio"],
    cmd="pnpm clean:frontend && pnpm build:frontend",
    deps=["studio/src"],
    resource_deps=["node_modules", "api-dist"],
)

local_resource(
    "studio-serve",
    labels=["studio"],
    deps=["studio/src"],
    resource_deps=["node_modules", "api-dist"],
    serve_cmd="pnpm dev",
    serve_dir="studio",
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
)

# Generate & migrate the database
local_resource(
    "db-generate",
    labels=["api"],
    dir="api",
    cmd="pnpm db:generate",
    deps=["api/drizzle.config.ts"],
)

local_resource(
    "db-migrate",
    labels=["api"],
    dir="api",
    cmd="pnpm db:migrate",
    deps=["api/migrate.ts"],
)

# Build & serve the api
local_resource(
    "api",
    labels=["api"],
    resource_deps=["node_modules", "db-generate", "db-migrate"],
    serve_cmd="pnpm dev",
    serve_dir="api",
)

local_resource(
    "reset-db",
    labels=["api"],
    cmd="rm fpx.db",
    dir="api",
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
)

local_resource(
    "format",
    labels=["api", "studio"],
    cmd="pnpm format",
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
)


# Examples

local_resource(
    "examples-node-api",
    dir="examples/node-api",
    labels=["examples"],
    serve_dir="examples/node-api",
    serve_cmd="pnpm dev",
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
)

local_resource(
    "examples-goose-quotes",
    dir="examples/goose-quotes",
    labels=["examples"],
    serve_dir="examples/goose-quotes",
    serve_cmd="pnpm db:generate && pnpm db:migrate && pnpm dev",
    auto_init=False,
    trigger_mode=TRIGGER_MODE_MANUAL,
)