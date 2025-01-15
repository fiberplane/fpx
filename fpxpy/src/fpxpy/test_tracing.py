import io

from typing import List

import pytest
from time import sleep
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export import SpanExporter
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.trace import SpanKind

from .tracing import __internal_setup_span_instrumentation
from .measure import measure


class SpanCollectorExporter(SpanExporter):
    spans: List[ReadableSpan]

    def __init__(self):
        self.spans = []
        self._shutdown = False

    def export(self, spans):
        if self._shutdown:
            return
        for span in spans:
            # Update the span in the list if it already exists
            for i, s in enumerate(self.spans):
                if s.context.span_id == span.context.span_id:
                    self.spans[i] = span
                    break
            else:
                # otherwise just append it
                self.spans.append(span)

    def reset(self):
        self.spans.clear()

    def shutdown(self):
        self._shutdown = True


@measure(name="loop")
def loop(n: int = 10) -> None:
    """A function that takes a while to run"""
    for i in range(n):
        sleep(0.01)


@pytest.fixture
def test_app():
    """Create a FastAPI app for testing"""

    app = FastAPI()

    @app.get("/test")
    async def test_endpoint():
        return {"message": "Hello, World!"}

    @app.get("/measure-test")
    async def measure_test():
        loop()
        return {"message": "Hello, measured world!"}

    @app.get("/error")
    async def error():
        raise HTTPException(status_code=500, detail="Hello, exceptional world!")

    return app


def add_instrumentation(app: FastAPI):
    """Add instrumentation to the app"""

    exporter = SpanCollectorExporter()
    app = __internal_setup_span_instrumentation(app, exporter)

    return exporter


def reset_output(output: io.StringIO):
    """Reset the output buffer"""
    output.seek(0)
    output.truncate(0)


def test_setup_span_instrumentation(test_app: FastAPI):
    """Test setup_span_instrumentation function"""
    assert len(test_app.user_middleware) == 0

    exporter = add_instrumentation(test_app)
    assert test_app.router.lifespan_context is not None
    assert len(test_app.user_middleware) == 1

    # Perform actions that generate spans
    client = TestClient(test_app)
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

    assert len(exporter.spans) == 1
    span = exporter.spans[0]
    assert span.name == "request"
    assert span.status.is_ok
    assert span.events[0].name == "first-response"


def test_custom_measure(test_app: FastAPI):
    """Test the measure decorator"""
    exporter = add_instrumentation(test_app)
    # Call a function that should generate a single span
    loop()

    assert len(exporter.spans) == 1
    span = exporter.spans[0]
    assert span.status.is_ok
    assert span.name == "loop"
    assert span.kind == SpanKind.INTERNAL
    assert span.parent is None

    exporter.reset()

    assert len(exporter.spans) == 0
    # Perform actions that generate spans
    client = TestClient(test_app)
    response = client.get("/measure-test")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, measured world!"}

    # Check captured output
    assert len(exporter.spans) == 2
    span = exporter.spans[0]
    assert span.name == "loop"
    assert span.status.is_ok
    span = exporter.spans[1]
    assert span.name == "request"
    assert span.status.is_ok
    assert span.events[0].name == "first-response"


def test_error_route(test_app: FastAPI):
    """Test check_error logic for routes (i.e. mark 50x responses as errors)"""
    exporter = add_instrumentation(test_app)

    # Perform actions that generate spans
    client = TestClient(test_app)
    try:
        response = client.get("/error")
        assert response.status_code == 500
        assert response.json() == {"detail": "Hello, exceptional world!"}
    except ValueError:
        pass

    # Check captured output
    assert len(exporter.spans) == 1
    assert exporter.spans[0].name == "request"
    assert exporter.spans[0].status.is_ok is False
