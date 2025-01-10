# fpx.py

Provides instrumentation and route detection for FastAPI apps.

### Installation

The package is available on PyPy, installing it as simple as

```
uv add fpxpy
```

### Usage

After installing `fpxpy` either from source or from `pip`, simply add the second line
referencing your `FastAPI` app.

```python
from fpxpy import setup

app = FastAPI()
setup(app)
```

### Running

After that, when running your FastAPI server, be sure to set the `FPX_ENDPOINT` env variable
pointing to your instance of Fiberplane Studio, e.g:

```
$ FPX_ENDPOINT=http://localhost:8788/v1/traces uv run fastapi dev main.py
```


#### Development

This package uses uv for its dependencies and running the tooling. The following tools are used for linting, checking & formatting. They are listed as part of the dev dependencies (and will be installed by uv by default). 

* [MyPy](https://www.mypy-lang.org/) for type checking. Run: `uv run mypy .`
* [ruff](https://docs.astral.sh/ruff/formatter/) for linting (`uv run ruff check`) and formatting (`uv run ruff format`)
