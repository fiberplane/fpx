# python-fastapi example

This project uses `uv`. To run:

```
$ uv sync --frozen
$ FPX_ENDPOINT=http://localhost:8788/v1/traces uv run fastapi dev main.py
```

Of course you also need to run studio next to it, for that you need [`npx`](https://docs.npmjs.com/cli/v7/commands/npx) . So you can run:

```
npx @fiberplane/studio
```
