from types import MappingProxyType
from typing import Coroutine, Any, Optional, List, Callable

# from opentelemetry import trace
from opentelemetry.attributes import BoundedAttributes
from opentelemetry.sdk.resources import Resource, Attributes
from opentelemetry.sdk.trace import TracerProvider, ReadableSpan, StatusCode
from opentelemetry.trace import (
    SpanKind,
    Status,
    Link,
    Span,
    set_tracer_provider,
    get_tracer_provider,
    SpanContext,
    TraceFlags,
    set_span_in_context,
    NonRecordingSpan,
)
from opentelemetry.sdk.trace.export import (
    SimpleSpanProcessor,
)
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult

from opentelemetry.context import get_current, set_value, attach, detach
import json
import random
from enum import Enum

import requests
from dataclasses import is_dataclass, dataclass, fields, asdict
from contextlib import asynccontextmanager

from humps import camelize
from fastapi import FastAPI, Request
from .measure import measure
from .utils import set_request_attributes
from fastapi.responses import Response
from .utils import get_response_attributes

from opentelemetry import trace, context
from opentelemetry.trace import (
    SpanContext,
    TraceFlags,
    set_span_in_context,
    get_current_span,
)


# /** Properties of a KeyValue. */
@dataclass
class KeyValueData:
    # /** KeyValue key */
    key: str
    # /** KeyValue value */
    value: Any

    def to_json(self):
        return {"key": self.key, "value": self.value}


@dataclass
class EventData:
    time_unix_nano: float
    name: str
    attributes: List[KeyValueData]
    dropped_attributes_count: int

    def to_json(self, include_null=False):
        return asdict(
            self,
            dict_factory=lambda fields: {
                camelize(key): to_json_serializable(value)
                for (key, value) in fields
                if value is not None or include_null
            },
        )


@dataclass
class LinkData:
    # /** Link traceId */
    trace_id: str
    # /** Link spanId */
    span_id: str
    # /** Link traceState */
    trace_state: Optional[str]
    # /** Link attributes */
    attributes: List[KeyValueData]
    # /** Link droppedAttributesCount */
    dropped_attributes_count: int

    def to_json(self, include_null=False):
        return asdict(
            self,
            dict_factory=lambda fields: {
                camelize(key): to_json_serializable(value)
                for (key, value) in fields
                if value is not None or include_null
            },
        )
        # return to_json_serializable(self, allow_to_json=False)


@dataclass
class InstrumentationScopeData:
    # /** InstrumentationScope name */
    name: str
    # /** InstrumentationScope version */
    version: Optional[str]
    # /** InstrumentationScope attributes */
    attributes: Optional[List[KeyValueData]]
    # /** InstrumentationScope droppedAttributesCount */
    dropped_attributes_count: Optional[int]

    def to_json(self, include_null=False):
        return asdict(
            self,
            dict_factory=lambda fields: {
                camelize(key): to_json_serializable(value)
                for (key, value) in fields
                if value is not None or include_null
            },
        )


@dataclass
class SpanData:
    trace_id: str
    spanId: str
    name: str
    kind: SpanKind
    start_time_unix_nano: float
    end_time_unix_nano: float
    attributes: List[KeyValueData]
    dropped_attributes_count: int
    events: List[EventData]
    dropped_events_count: int
    links: List[LinkData]
    dropped_links_count: int
    status: Status
    trace_state: Optional[str] = None
    parent_span_id: Optional[str] = None

    def to_json(self, include_null=False):
        return asdict(
            self,
            dict_factory=lambda fields: {
                camelize(key): to_json_serializable(value)
                for (key, value) in fields
                if value is not None or include_null
            },
        )


@dataclass
class ScopeSpanData:
    scope: Optional["InstrumentationScopeData"] = None
    spans: Optional[List["SpanData"]] = None
    schema_url: Optional[str] = None

    def to_json(self, include_null=False):
        return asdict(
            self,
            dict_factory=lambda fields: {
                camelize(key): to_json_serializable(value)
                for (key, value) in fields
                if value is not None or include_null
            },
        )


@dataclass
class ResourceSpanData:
    scope_spans: List[ScopeSpanData]
    resource: Optional[Resource] = None
    schema_url: Optional[str] = None

    def to_json(self, include_null=False):
        # Create a dict with serializable values
        result = {
            "scopeSpans": [span.to_json() for span in self.scope_spans],
            "schemaUrl": self.schema_url,
        }

        if self.resource is not None:
            if isinstance(self.resource, Resource):
                result["resource"] = {
                    "attributes": to_key_values(self.resource.attributes),
                    "droppedAttributesCount": 0,
                }

        return {k: v for k, v in result.items() if v is not None or include_null}


def setup_tracer_provider(endpoint: str, service_name="unknown"):
    """Set up a tracer provider

    Args:
        endpoint (str): _description_
        service_name (str, optional): _description_. Defaults to "unknown".

    Returns:
        _type_: _description_
    """
    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    span_exporter = JSONSpanExporter(
        endpoint,
    )
    provider.add_span_processor(SimpleSpanProcessor(span_exporter))

    set_tracer_provider(provider)
    new_provider = get_tracer_provider()
    return new_provider


def to_key_values(attributes: Attributes):
    result = [
        KeyValueData(key=key, value={"stringValue": value})
        for key, value in attributes.items()
    ]
    return result


def to_event(event):
    return EventData(
        time_unix_nano=event.timestamp,
        name=event.name,
        attributes=to_key_values(event.attributes),
        dropped_attributes_count=0,
    )


def to_link(link: Link):
    return LinkData(
        trace_id=int_to_hex_str(link.context.trace_id),
        span_id=int_to_hex_str(link.context.span_id),
        trace_state=None,
        attributes=(
            to_key_values(link.attributes) if link.attributes is not None else []
        ),
        dropped_attributes_count=0,
    )


def create_status(status_code: StatusCode, description: Optional[str] = None) -> Status:
    if status_code == StatusCode.OK:
        return Status(status_code=status_code)

    return Status(status_code=status_code, description=description)


def int_to_hex_str(num: int) -> str:
    """Convert integer to hex string padded to 16 chars"""
    return format(num, "016x")


def to_span(span: ReadableSpan) -> SpanData:
    """Convert a ReadableSpan to SpanData"""

    print("links", span.links)
    return SpanData(
        trace_id=int_to_hex_str(span.context.trace_id or 0),
        spanId=int_to_hex_str(span.context.span_id or 0),
        name=span.name,
        kind=SpanKind[span.kind.name],
        start_time_unix_nano=(
            float(span.start_time) if span.start_time is not None else 0.0
        ),
        end_time_unix_nano=float(span.end_time) if span.end_time is not None else 0.0,
        attributes=(
            to_key_values(span.attributes) if span.attributes is not None else []
        ),
        dropped_attributes_count=0,
        events=[to_event(event) for event in span.events],
        dropped_events_count=0,
        links=[to_link(link) for link in span.links],
        dropped_links_count=0,
        status=create_status(span.status.status_code, span.status.description),
        trace_state=None,
        parent_span_id=int_to_hex_str(span.parent.span_id) if span.parent else None,
    )


def to_resource_span(span: ReadableSpan) -> ResourceSpanData:
    """Convert a span to a ResourceSpanData object"""
    return ResourceSpanData(
        resource=span.resource,
        scope_spans=[
            ScopeSpanData(
                scope=InstrumentationScopeData(
                    name=span.instrumentation_info.name,
                    version=span.instrumentation_info.version,
                    attributes=None,
                    dropped_attributes_count=None,
                ),
                spans=[to_span(span)],
            )
        ],
        schema_url=None,
    )


def to_json_serializable(obj: Any, allow_to_json=True) -> Any:
    if is_dataclass(obj):
        if allow_to_json and hasattr(obj, "to_json"):
            return obj.to_json()
        items = fields(obj)
        result = {}
        for item in items:
            value = getattr(obj, item.name)
            result[item.name] = to_json_serializable(value)
        return result
    elif isinstance(obj, (list, tuple)):
        return [to_json_serializable(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, Enum):
        print("obj", obj)
        return obj.value
    elif isinstance(obj, Status):
        return to_json_serializable(
            {"code": obj.status_code.value, "message": obj.description}
        )
    elif isinstance(obj, dict):
        print("is dict", obj)
        return {k: to_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, BoundedAttributes):
        return obj.copy()
    elif isinstance(obj, Resource):
        return {
            "attributes": to_json_serializable(to_key_values(obj.attributes)),
            "schemaUrl": obj.schema_url,
        }
    elif isinstance(obj, MappingProxyType):
        return obj.copy()

    # print("falling bac", obj, type(obj))
    return obj


@dataclass
class SpansPayload:
    resource_spans: List[ResourceSpanData]

    def to_json(self):
        return {
            "resourceSpans": [
                to_json_serializable(span) for span in self.resource_spans
            ]
        }
        # return asdict(
        #     self,
        #     dict_factory=lambda fields: {
        #         camelize(key): to_json_serializable(value)
        #         for (key, value) in fields
        #         if value is not None or include_null
        #     },
        # )


class JSONSpanExporter(SpanExporter):
    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def export(self, spans):
        resource_spans = [to_resource_span(span) for span in spans]

        payload = SpansPayload(resource_spans=resource_spans)

        content = payload.to_json()
        json_data = json.dumps(content, cls=CustomJSONEncoder)

        try:
            response = requests.post(
                self.endpoint,
                data=json_data,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            if response.status_code == 200:
                return SpanExportResult.SUCCESS
        except requests.Timeout:
            # back off and retry
            pass
        except requests.ConnectionError:
            pass
            # # Send JSON data to the endpoint
            # response = post(

            # )

            return SpanExportResult.FAILURE

    def shutdown(self):
        pass


def setup_span_instrumentation(instance: FastAPI):
    """
    This function returns a patched instance of the fastAPI app.

    All requests to the app will be automatically traced.
    """

    setup_tracer_provider(endpoint="http://localhost:8788/v1/traces")

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        # Set up before startup
        yield
        # Clean up after shutdown

    instance.router.lifespan_context = lifespan

    async def middleware(request: Request, call_next):
        trace_id = request.headers.get("x-fpx-trace-id")

        token = None
        if trace_id:
            # trace_id = request.headers.get("x-fpx-trace-id")
            # version, trace_id, span_id, trace_flags = traceparent.split("-")

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
            # async def middleware(

    #     request: Request, call_next: Callable[[Request], Coroutine[Any, Any, Response]]
    # ):
    #     # trace_id = request.headers.get("x-fpx-trace-id")
    #     # if trace_id:
    #     #     # # Convert hex string to int
    #     #     # trace_id_int = int(trace_id, 16)
    #     #     # # Create new span context with the trace ID
    #     #     # span_context = SpanContext(
    #     #     #     trace_id=trace_id_int,
    #     #     #     span_id=random.getrandbits(64),  # Generate new span ID
    #     #     #     is_remote=True,
    #     #     #     trace_flags=TraceFlags(TraceFlags.SAMPLED),
    #     #     # )
    #     #     # context = get_current()
    #     #     # context.update(
    #     #     #     {
    #     #     #         "traceparent": f"00-{trace_id}-0000000000000000-01",
    #     #     #     }
    #     #     # )

    #     #     # set_current(context)
    #     #     # print("traceparent", context.get("traceparent"))
    #     #     # Set as current context
    #     #     ctx = set_span_in_context(span_context)
    #     #     token = attach(ctx)
    #     #

    #     # try:
    #     measured_next = measure(
    #         name="request",
    #         func=call_next,
    #         on_start=set_request_attributes,
    #         on_success=on_success,
    #     )
    #     return await measured_next(request)

    # # finally:
    # #     if trace_id:
    # #         detach(token)

    instance.middleware("http")(middleware)
    return instance


async def on_success(span: Span, response: Response) -> None:
    """Handle successful response with span updates"""
    span.add_event("first-response")

    attributes = await get_response_attributes(response)
    span.set_attributes(dict(attributes))
    return None


class CustomJSONEncoder(json.JSONEncoder):
    """Encoder that serializes objects with a to_json method"""

    def default(self, o):
        if hasattr(o, "to_json"):
            return o.to_json()
        return super().default(o)

    def encode(self, o):
        if isinstance(o, dict):
            return (
                "{" + ", ".join(f'"{k}": {self.encode(v)}' for k, v in o.items()) + "}"
            )
        elif isinstance(o, list):
            return "[" + ", ".join(self.encode(e) for e in o) + "]"
        return super().encode(o)


def createTraceparentId(traceId: str) -> str:
    return f"00-{traceId}-0000000000000000-01"
