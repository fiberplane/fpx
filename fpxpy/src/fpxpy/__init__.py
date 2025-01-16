import os
from urllib.parse import urlparse
from typing import Optional, Callable

from fastapi import FastAPI
from .tracing import setup_span_instrumentation
from .routes import install
from .measure import measure
from .logger import logger, capture_logs

__all__ = ["setup", "measure"]


__teardown_capture_logs: Optional[Callable[[], None]] = None


def setup(app: FastAPI) -> None:
    """
    Setup the FPX integration with FastAPI

    Args:
        app (FastAPI): The FastAPI app to integrate with

    """
    # setup route detection
    endpoint = os.getenv("FPX_ENDPOINT")

    if endpoint is None:
        logger.info("FPX_ENDPOINT is not set, fpx functionality is disabled")
        return None

    install(app)

    url = urlparse(endpoint)
    # setup span instrumentation
    setup_span_instrumentation(app, url)

    # Avoid capturing logs multiple times
    global __teardown_capture_logs
    if __teardown_capture_logs is not None:
        __teardown_capture_logs()

    __teardown_capture_logs = capture_logs()
