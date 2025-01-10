import io

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export import ConsoleSpanExporter

from fpxpy.tracing import __internal_setup_span_instrumentation


@pytest.fixture
def test_app():
    """Create a FastAPI app for testing"""
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint():
        return {"message": "Hello, World!"}

    return app


def test_setup_span_instrumentation(test_app: FastAPI):
    """Test setup_span_instrumentation function"""
    assert len(test_app.user_middleware) == 0

    # Capture ConsoleSpanExporter output
    output = io.StringIO()
    app_with_tracing = __internal_setup_span_instrumentation(
        test_app, ConsoleSpanExporter(out=output)
    )

    assert app_with_tracing is not None
    assert app_with_tracing.router.lifespan_context is not None
    assert len(app_with_tracing.user_middleware) == 1

    # Perform actions that generate spans
    client = TestClient(app_with_tracing)
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

    # Check captured output
    output_value = output.getvalue()
    # print(output_value)
    assert "first-response" in output_value  # Example check, adjust as needed
