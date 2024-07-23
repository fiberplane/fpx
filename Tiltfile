# Automagically install & update npm dependencies when package.json changes
local_resource(
    "node_modules",
    labels=["api", "frontend"],
    deps=["package.json", "api/package.json", "frontend/package.json"],
    dir=".",
    cmd="npm install",
)

# Ensure the api/dist directory exists
local_resource(
    "api-dist",
    labels=["api"],
    cmd="mkdir api/dist || true",
)

# Build & serve the frontend
local_resource(
    "frontend-build",
    labels=["frontend"],
    cmd="npm run clean:frontend && npm run build:frontend",
    deps=["frontend/src"],
    resource_deps=["node_modules", "api-dist"],
)

local_resource(
    "frontend-serve",
    labels=["frontend"],
    deps=["frontend/src"],
    resource_deps=["node_modules", "api-dist"],
    serve_cmd="npm run dev",
    serve_dir="frontend",
    trigger_mode=TRIGGER_MODE_MANUAL,
)

# Generate & migrate the database
local_resource(
    "db-generate",
    labels=["api"],
    dir="api",
    cmd="npm run db:generate",
    deps=["api/drizzle.config.ts"],
)

local_resource(
    "db-migrate",
    labels=["api"],
    dir="api",
    cmd="npm run db:migrate",
    deps=["api/migrate.ts"],
)

# Build & serve the api
local_resource(
    "api",
    labels=["api"],
    resource_deps=["node_modules", "db-generate", "db-migrate"],
    serve_cmd="npm run dev",
    serve_dir="api",
)