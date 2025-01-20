import os
from typing import Callable, Optional
from urllib.parse import urlparse

from fastapi import FastAPI

from .capturePrint import setup_capture_print_middleware
from .logger import capture_logs, logger
from .measure import measure
from .routes import install
from .tracing import setup_span_instrumentation

__all__ = ["setup", "measure"]


__teardown_capture_logs: Optional[Callable[[], None]] = None


def setup(app: FastAPI, capture_stdout_stderr=True) -> None:
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

    if capture_stdout_stderr:
        # Capture prints to stdout/stderr
        setup_capture_print_middleware(app)

    # Avoid capturing logs multiple times
    global __teardown_capture_logs
    if __teardown_capture_logs is not None:
        __teardown_capture_logs()

    __teardown_capture_logs = capture_logs()
