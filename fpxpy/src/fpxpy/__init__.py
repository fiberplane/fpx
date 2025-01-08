import os
from urllib.parse import urlparse

from fastapi import FastAPI
from .tracing import setup_span_instrumentation
from .routes import install
from .measure import measure

__all__ = ["setup", "measure"]


def setup(app: FastAPI) -> FastAPI:
    # setup route detection
    endpoint = os.getenv("FPX_ENDPOINT")

    if endpoint is None:
        print("FPX_ENDPOINT is not set, fpx functionality is disabled")
        return app

    install(app)

    url = urlparse(endpoint)
    # setup span instrumentation
    setup_span_instrumentation(app, url)

    return app
