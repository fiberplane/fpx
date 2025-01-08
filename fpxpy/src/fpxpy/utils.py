from fastapi import Request
from opentelemetry.trace import Span
from opentelemetry.context import set_value
from typing import Dict, Optional, Sequence
from fastapi import Response
from opentelemetry.sdk.resources import Attributes

import json


def get_request_attributes(
    request: Request,
) -> Attributes:
    """Extract OpenTelemetry attributes from FastAPI request"""
    # print("request.url", request.url.path)
    # Add headers as attributes

    attributes: Attributes = {
        # attributes = {
        "fpx.http.request.scheme": request.url.scheme,
        "http.scheme": request.url.scheme,
        "fpx.http.request.search": request.url.query,
        "http.host": request.headers.get("host", ""),
        "http.target": request.url.path,
        "url.full": str(request.url),
        "fpx.http.request.pathname": request.url.path,
        "http.url": str(request.url),
        "http.user_agent": request.headers.get("user-agent", ""),
        "http.request.method": request.method,
        # Common HTTP request headers as attributes
        "http.request.header.accept": request.headers.get("accept", ""),
        # "http.request.header.content_length": request.headers.get("content-length", ""),
        # "http.request.header.content_type": request.headers.get("content-type", ""),
    }

    for key, value in request.headers.items():
        # print("response.headers.items", key, value)
        attributes = dict(attributes)
        attributes[f"http.request.header.{key.lower()}"] = value

    return attributes


def set_request_attributes(
    span: Span,
    request: Request,
    root_request_attributes: Optional[Dict[str, str]] = None,
):
    """Set request attributes on span"""

    # trace_id = request.headers.get("x-fpx-trace-id")
    # if trace_id:
    # # Convert hex string to int
    # trace_id_int = int(trace_id, 16)
    # # Create new span context with the trace ID
    # span_context = SpanContext(
    #     trace_id=trace_id_int,
    #     span_id=random.getrandbits(64),  # Generate new span ID
    #     is_remote=True,
    #     trace_flags=TraceFlags(TraceFlags.SAMPLED),
    # )
    # context = span.get_span_context()
    # context.
    # set_value("traceparent", f"00-{trace_id}-0000000000000000-01", context)
    # context.update(
    #     {
    #         "traceparent": f"00-{trace_id}-0000000000000000-01",
    #     }
    # )

    # set_current(context)
    # print("traceparent", context.get("traceparent"))
    # Set as current context
    # ctx = set_span_in_context(span_context)
    # token = attach(ctx)

    # print("context", span.get_span_context())
    request_attributes = {
        **get_request_attributes(request),
        **(root_request_attributes or {}),
    }
    span.set_attributes(request_attributes)


async def get_response_attributes(response: Response) -> Attributes:
    """Extract OpenTelemetry attributes from FastAPI response"""
    attributes: Attributes = {
        "http.response.status_code": str(response.status_code),
        "http.scheme": (
            "https" if response.headers.get("x-forwarded-proto") == "https" else "http"
        ),
    }

    # Add response body if available
    content_type = response.headers.get("content-type", "")

    # Handle different content types
    try:
        if hasattr(response, "body"):
            body = (
                response.body.decode()
                if isinstance(response.body, bytes)
                else str(response.body)
            )
            if content_type and "application/json" in content_type:
                # Validate JSON before adding
                json.loads(body)
            attributes = dict(attributes)
            attributes["http.response.body"] = str(body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        # Skip body if we can't decode it
        pass

    # Add headers as attributes
    for key, value in response.headers.items():
        # print("response.headers.items", key, value)
        attributes = dict(attributes)
        attributes[f"http.response.header.{key.lower()}"] = value

    return attributes
