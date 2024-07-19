# Automagically install & update npm dependencies when package.json changes
local_resource(
    "api-node-modules",
    deps=["api/package.json"],
    dir="api",
    cmd="npm install",
)
local_resource(
    "frontend-node-modules",
    deps=["frontend/package.json"],
    dir="frontend",
    cmd="npm install",
)

# Ensure the api/dist directory exists
local_resource(
    "api-dist",
    cmd="mkdir api/dist || true",
)

# Build & serve the frontend
local_resource(
    "frontend-build",
    cmd="npm run clean:frontend && npm run build:frontend",
    deps=["frontend/src"],
    resource_deps=["frontend-node-modules", "api-dist"],
)

local_resource(
    "frontend-serve",
    deps=["frontend/src"],
    resource_deps=["frontend-node-modules", "api-dist"],
    serve_cmd="npm run dev",
    serve_dir="frontend",
    trigger_mode=TRIGGER_MODE_MANUAL,
)

# Generate & migrate the database
local_resource(
    "db-generate",
    dir="api",
    cmd="npm run db:generate",
    deps=["api/drizzle.config.ts"],
)

local_resource(
    "db-migrate",
    dir="api",
    cmd="npm run db:migrate",
    deps=["api/migrate.ts"],
)

# Build & serve the api
local_resource(
    "api",
    resource_deps=["api-node-modules", "db-generate", "db-migrate"],
    serve_cmd="npm run dev",
    serve_dir="api",
)
