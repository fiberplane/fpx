from fastapi import FastAPI
from .tracing import instrument
from .routes import install


def setup(app: FastAPI) -> FastAPI:
    # setup route detection
    install(app)

    # setup span instrumentation
    instrument(app)

    return app
