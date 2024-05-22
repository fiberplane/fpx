## Running mizu

```sh
# Auth with neon
neonctl auth
# Get database connection string for `dev` branch
# TODO - add project id...
DATABASE_URL=$(neonctl connection-string dev)
# Add to .dev.vars
echo -e "\nDATABASE_URL=$DATABASE_URL" >> .dev.vars

# Install deps and run app
npm install

# NOTE - need to run as node.js to have access to file system for fun features...
npm run node:dev
```

### Deploy
```sh
npm run deploy
```

## OTLP (not working)

This would be how to run an otel collector with the config file in this repo:

```sh
docker run -v $(pwd)/config.yaml:/etc/otelcol-contrib/config.yaml otel/opentelemetry-collector-contrib:0.100.0
```