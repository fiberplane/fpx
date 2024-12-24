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
