from fastapi import FastAPI
from .tracing import setup_span_instrumentation
from .routes import install
from .measure import measure


def setup(app: FastAPI) -> FastAPI:
    # setup route detection
    install(app)

    # setup span instrumentation
    setup_span_instrumentation(app)

    return app
