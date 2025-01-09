import random
from contextlib import asynccontextmanager
from urllib.parse import ParseResult as ParsedUrl
from urllib.parse import urlunparse

from fastapi import FastAPI, Request
from fastapi.responses import Response
from opentelemetry import context

from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    SimpleSpanProcessor,
    SpanExporter,
)
from opentelemetry.trace import (
    NonRecordingSpan,
    Span,
    SpanContext,
    TraceFlags,
    get_tracer_provider,
    set_span_in_context,
    set_tracer_provider,
)

from .JSONSpanExporter import JSONSpanExporter

from .measure import measure
from .utils import get_response_attributes, set_request_attributes


def setup_tracer_provider(
    span_exporter: SpanExporter,
    service_name="unknown",
):
    """Set up a tracer provider

    Args:
        endpoint (str): _description_
        service_name (str, optional): _description_. Defaults to "unknown".

    """
    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    print("span_exporter", span_exporter)
    provider.add_span_processor(SimpleSpanProcessor(span_exporter))

    set_tracer_provider(provider)
    new_provider = get_tracer_provider()
    return new_provider


async def middleware(request: Request, call_next):
    """Middleware to handle tracing"""

    trace_id = request.headers.get("x-fpx-trace-id")

    # Check if it is a route inspector request
    route_inspector = request.headers.get("x-fpx-route-inspector")
    if route_inspector == "enabled":
        return await call_next(request)

    token = None
    if trace_id:
        # Convert hex strings to integers
        trace_id_int = int(trace_id, 16)
        span_id_int = span_id_int = random.getrandbits(64)  # Generate new span ID
        trace_flags_int = 1

        # Create new SpanContext
        span_context = SpanContext(
            trace_id=trace_id_int,
            span_id=span_id_int,
            is_remote=True,
            trace_flags=TraceFlags(trace_flags_int),
        )

        # Create a NonRecordingSpan with the SpanContext
        non_recording_span = NonRecordingSpan(span_context)

        # Attach new context to current span
        ctx = set_span_in_context(non_recording_span)
        token = context.attach(ctx)

    try:
        measured_next = measure(
            name="request",
            func=call_next,
            on_start=set_request_attributes,
            on_success=on_success,
        )
        return await measured_next(request)
    finally:
        if token is not None:
            context.detach(token)


def setup_span_instrumentation(instance: FastAPI, endpoint: ParsedUrl) -> FastAPI:
    """
    This function adds tracing middleware to the FastAPI app.

    All requests to the app will be automatically traced.
    """
    return __internal_setup_span_instrumentation(
        instance,
        span_exporter=JSONSpanExporter(
            urlunparse(endpoint),
        ),
    )


def __internal_setup_span_instrumentation(
    instance: FastAPI,
    span_exporter: SpanExporter,
) -> FastAPI:
    """
    This function adds tracing middleware to the FastAPI app.

    All requests to the app will be automatically traced.
    """

    setup_tracer_provider(span_exporter)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        # Set up before startup
        yield
        # TODO: Clean up after shutdown

    instance.router.lifespan_context = lifespan

    instance.middleware("http")(middleware)
    return instance


async def on_success(span: Span, response: Response) -> None:
    """Handle successful response with span updates"""
    span.add_event("first-response")

    attributes = await get_response_attributes(response)
    span.set_attributes(dict(attributes))
    return None