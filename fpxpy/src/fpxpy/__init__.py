from fastapi import FastAPI
from .tracing import setup_span_instrumentation
from .routes import install


def setup(app: FastAPI) -> FastAPI:
    # setup route detection
    install(app)

    # setup span instrumentation
    setup_span_instrumentation(app)

    return app
