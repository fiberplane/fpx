## Running mizu

> You'll want to follow the instructions in `Configuring Neon (the Database)` before running the app

```sh
npm install

npm db:generate
npm db:migrate

# NOTE - This app runs Hono in a Node.js execution context by default,
#        Since we need access to the filesystem to do fun stuff
npm run dev 
```

### Configuring Neon (the Database)

Neon commands! This can help set up or configure a neon database for project named `mizu`, where you can store telemetry data.

```sh
# Authenticate with neon cli
neonctl auth

# Create project if you haven't already
PROJECT_NAME=mizu
neonctl projects create --name $PROJECT_NAME --set-context

# Set project id because the call to `set-context` below needs it
PROJECT_ID=$(neonctl projects list --output=json | jq --arg name "$PROJECT_NAME" '.projects[] | select(.name == $name) | .id')

# Create a `dev` db branch then set context
BRANCH_NAME=dev
neonctl branches create --name=$BRANCH_NAME
neonctl set-contenxt --project-id=$PROJECT_ID --branch=$BRANCH_NAME

# Finally, add connection string to .dev.vars
DATABASE_URL=$(neonctl connection-string)
echo -e '\nDATABASE_URL='$DATABASE_URL'\n' >> .dev.vars
```

### Adding some AI

- Get an OpenAI API Key
- Add it to `.dev.vars`
- Voilà

## Otlp (NOT IMPLEMENTED)

This would be how to run an otel collector with the config file in this repo:

```sh
docker run -v $(pwd)/config.yaml:/etc/otelcol-contrib/config.yaml otel/opentelemetry-collector-contrib:0.100.0
```