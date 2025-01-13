import json
from typing import Dict, Optional

from fastapi import Request, Response
from opentelemetry.sdk.resources import Attributes
from opentelemetry.trace import Span


def get_request_attributes(
    request: Request,
) -> Attributes:
    """Extract OpenTelemetry attributes from FastAPI request"""
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
        attributes = dict(attributes)
        attributes[f"http.request.header.{key.lower()}"] = value

    return attributes


def set_request_attributes(
    span: Span,
    request: Request,
    root_request_attributes: Optional[Dict[str, str]] = None,
):
    """Set request attributes on span"""
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
        attributes = dict(attributes)
        attributes[f"http.response.header.{key.lower()}"] = value

    return attributes
