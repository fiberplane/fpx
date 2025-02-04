import io
from time import sleep, time_ns
from typing import List

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from fastapi.responses import StreamingResponse
from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import SpanExporter
from opentelemetry.trace import SpanKind
from asyncio import sleep as async_sleep
import json
import httpx

from .measure import measure
from .tracing import __internal_setup_span_instrumentation


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
    
    @app.get("/sse")
    def sse():
        return StreamingResponse(event_stream(), media_type="text/event-stream")


    return app

async def event_stream():
    for value in range(10):
        data = json.dumps({
            "value": value
        })
        yield f"data: event {data}\n\n"
        await async_sleep(0.1)


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

@pytest.mark.asyncio
async def test_sse_route(test_app: FastAPI):
    """Test check_error logic for routes (i.e. mark 50x responses as errors)"""
    exporter = add_instrumentation(test_app)

    # Perform actions that generate spans
    # client = TestClient(test_app)
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://testserver") as client:
        start = time_ns()
        async with client.stream("GET", "/sse") as response:
            print("response", (time_ns()-start)/1000000 )
 
            times = []
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    print(f"Received: {line} at {time_ns()}")
                    times.append(time_ns())
            duration = time_ns() - start
            print(duration / 1000000)
            assert duration/1000000 > 1000
            assert len(times) == 10
            print("status", (time_ns()-start)/1000000 )

        # Check captured output
        assert len(exporter.spans) == 1
        assert exporter.spans[0].name == "request"
        assert exporter.spans[0].status.is_ok is True

@measure(name="sync_numbers")
def generate_numbers(count: int = 3):
    """A synchronous generator that yields numbers"""
    for i in range(count):
        yield i

@measure(name="async_letters")
async def generate_letters(count: int = 3):
    """An asynchronous generator that yields letters"""
    for i in range(count):
        await async_sleep(0.01)  # Small delay to simulate async work
        yield chr(65 + i)  # Yields 'A', 'B', 'C', etc.

def test_sync_iterator(test_app: FastAPI):
    """Test the measure decorator with a synchronous iterator"""
    exporter = add_instrumentation(test_app)
    
    # Collect all values from the generator
    values = list(generate_numbers(3))
    assert values == [0, 1, 2]
    
    # Check that we have the correct number of spans (1 parent + 3 iterations)
    assert len(exporter.spans) == 4
    
    # Find the parent span
    parent_span = next(span for span in exporter.spans if span.name == "sync_numbers")
    assert parent_span.status.is_ok
    
    # Check iteration spans
    iteration_spans = [span for span in exporter.spans if span.name.startswith("sync_numbers[")]
    assert len(iteration_spans) == 3
    
    # Verify each iteration span
    for i, span in enumerate(iteration_spans):
        assert span.name == f"sync_numbers[{i}]"
        assert span.status.is_ok
        assert span.parent.span_id == parent_span.context.span_id

@pytest.mark.asyncio
async def test_async_iterator(test_app: FastAPI):
    """Test the measure decorator with an asynchronous iterator"""
    exporter = add_instrumentation(test_app)
    
    # Collect all values from the async generator
    values = []
    async for letter in generate_letters(3):
        values.append(letter)
    
    assert values == ['A', 'B', 'C']
    
    # Check that we have the correct number of spans (1 parent + 3 iterations)
    assert len(exporter.spans) == 4
    
    # Find the parent span
    parent_span = next(span for span in exporter.spans if span.name == "async_letters")
    assert parent_span.status.is_ok
    
    # Check iteration spans
    iteration_spans = [span for span in exporter.spans if span.name.startswith("async_letters[")]
    assert len(iteration_spans) == 3
    
    # Verify each iteration span
    for i, span in enumerate(iteration_spans):
        assert span.name == f"async_letters[{i}]"
        assert span.status.is_ok
        assert span.parent.span_id == parent_span.context.span_id

@measure(name="error_generator")
def generate_with_error():
    """A generator that raises an exception during iteration"""
    yield 0
    yield 1
    raise ValueError("Simulated error")
    yield 2  # This will never be reached

def test_iterator_error_handling(test_app: FastAPI):
    """Test error handling in iterator spans"""
    exporter = add_instrumentation(test_app)
    
    # Collect values until error
    values = []
    with pytest.raises(ValueError, match="Simulated error"):
        for value in generate_with_error():
            values.append(value)
    
    assert values == [0, 1]
    
    # Check spans (1 parent + 2 successful iterations)
    assert len(exporter.spans) == 3
    
    # Find the parent span
    parent_span = next(span for span in exporter.spans if span.name == "error_generator")
    assert not parent_span.status.is_ok
    assert "Simulated error" in parent_span.status.description
    
    # Check iteration spans
    iteration_spans = [span for span in exporter.spans if span.name.startswith("error_generator[")]
    assert len(iteration_spans) == 2
    
    # Verify successful iteration spans
    for i, span in enumerate(iteration_spans):
        assert span.name == f"error_generator[{i}]"
        assert span.status.is_ok
        assert span.parent.span_id == parent_span.context.span_id

def on_iteration_success(span, value):
    """Callback for testing success handling"""
    span.set_attribute("value", str(value))

@measure(name="callback_generator", on_success=on_iteration_success)
def generate_with_callback(count: int = 2):
    """A generator that uses callbacks"""
    for i in range(count):
        yield i * 2

def test_iterator_callbacks(test_app: FastAPI):
    """Test callbacks in iterator spans"""
    exporter = add_instrumentation(test_app)
    
    # Collect all values
    values = list(generate_with_callback())
    assert values == [0, 2]
    
    # Check spans (1 parent + 2 iterations)
    assert len(exporter.spans) == 3
    
    # Check iteration spans
    iteration_spans = [span for span in exporter.spans if span.name.startswith("callback_generator[")]
    assert len(iteration_spans) == 2
    
    # Verify each iteration span has the correct attribute from the callback
    for i, span in enumerate(iteration_spans):
        assert span.attributes.get("value") == str(i * 2)
        assert span.status.is_ok
