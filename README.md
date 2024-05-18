```
npm install
npm run dev
```

```
npm run deploy
```

## OTLP

```sh
docker run -v $(pwd)/config.yaml:/etc/otelcol-contrib/config.yaml otel/opentelemetry-collector-contrib:0.100.0
```