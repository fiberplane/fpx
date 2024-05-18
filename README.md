## Running mizu

```sh
# Get database connection string for `dev` branch
DATABASE_URL=$(neonctl connection-string dev)
# Add to .dev.vars
echo -e "\nDATABASE_URL=$DATABASE_URL" >> .dev.vars

# Install deps and run app
npm install
npm run dev
```

```
npm run deploy
```

- `console.log` is 

## OTLP (not working)

This would be how to run an otel collector with the config file in this repo:

```sh
docker run -v $(pwd)/config.yaml:/etc/otelcol-contrib/config.yaml otel/opentelemetry-collector-contrib:0.100.0
```