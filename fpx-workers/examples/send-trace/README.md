# Manually submitting a trace

The following curl command shows how you can send a trace to the worker. Be sure
to update the secret token in the command.

```bash
curl -X POST http://localhost:8787/v1/traces \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json" \
  --data-binary @trace.json
```
