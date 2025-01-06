# from typing import Dict
from types import MappingProxyType
from opentelemetry import trace
from opentelemetry.attributes import BoundedAttributes
from opentelemetry.sdk.resources import Resource, Attributes
from opentelemetry.sdk.trace import TracerProvider, ReadableSpan, StatusCode, Span
from opentelemetry.trace import SpanKind, Status, Link
from opentelemetry.sdk.trace.export import (
    SimpleSpanProcessor,
)
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult
import json
from enum import Enum

import requests
from dataclasses import is_dataclass, dataclass, fields
from typing import Any, Optional, List
from contextlib import asynccontextmanager

# from types import mappingproxy
from fastapi import FastAPI, Request
from .measure import measure
from .utils import set_request_attributes
from fastapi.responses import Response
from .utils import get_response_attributes


# /** Properties of a KeyValue. */
@dataclass
class KeyValueData:
    # /** KeyValue key */
    key: str
    # /** KeyValue value */
    value: Any

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class EventData:
    timeUnixNano: float
    name: str
    attributes: List[KeyValueData]
    droppedAttributesCount: int

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class LinkData:
    # /** Link traceId */
    traceId: str
    # /** Link spanId */
    spanId: str
    # /** Link traceState */
    traceState: Optional[str]
    # /** Link attributes */
    attributes: List[KeyValueData]
    # /** Link droppedAttributesCount */
    droppedAttributesCount: int

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class InstrumentationScopeData:
    # /** InstrumentationScope name */
    name: str
    # /** InstrumentationScope version */
    version: Optional[str]
    # /** InstrumentationScope attributes */
    attributes: Optional[List[KeyValueData]]
    # /** InstrumentationScope droppedAttributesCount */
    droppedAttributesCount: Optional[int]

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class SpanData:
    traceId: str
    spanId: str
    name: str
    kind: SpanKind
    startTimeUnixNano: float
    endTimeUnixNano: float
    attributes: List[KeyValueData]
    droppedAttributesCount: int
    events: List[EventData]
    droppedEventsCount: int
    links: List[LinkData]
    droppedLinksCount: int
    status: Status
    traceState: Optional[str] = None
    parentSpanId: Optional[str] = None

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class ScopeSpanData:
    scope: Optional["InstrumentationScopeData"] = None
    spans: Optional[List["SpanData"]] = None
    schema_url: Optional[str] = None

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


@dataclass
class ResourceSpanData:
    resource: Optional[Resource] = None
    scopeSpans: List[ScopeSpanData] = None
    schema_url: Optional[str] = None

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


# from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
#     OTLPSpanExporter,
# )

# from opentelemetry.shim import opentracing_shim

# __provider = TracerProvider()
# __processor = SimpleSpanProcessor(OtlpGrpcSpanExporter())
# __provider.add_span_processor(__processor)

# Sets the global default tracer provider
# trace.set_tracer_provider(__provider)

# Creates a tracer from the global tracer provider
# tracer = trace.get_tracer("my.tracer.name")


def setup_tracer_provider(endpoint: str, service_name="unknown"):
    """Set up a tracer provider

    Args:
        endpoint (str): _description_
        service_name (str, optional): _description_. Defaults to "unknown".

    Returns:
        _type_: _description_
    """
    # new_provider =
    trace.set_tracer_provider(
        TracerProvider(resource=Resource.create({"service.name": service_name}))
    )
    new_provider = trace.get_tracer_provider()
    print("endpoint", endpoint)
    span_exporter = JSONSpanExporter(
        endpoint,
    )
    new_provider.add_span_processor(SimpleSpanProcessor(span_exporter))
    # new_provider.
    # opentracing_tracer = opentracing_shim.create_tracer(tracer_provider)
    return new_provider
    # opentracing_tracer = opentracing_shim.create_tracer(tracer_provider)
    # processor = SimpleSpanProcessor(OTLPSpanExporter(endpoint=endpoint, insecure=True))
    # new_provider.add_span_processor(processor)
    # new_provider.register()
    # return new_provider


def to_key_values(attributes: Attributes):
    result = [
        KeyValueData(key=key, value={"stringValue": value})
        for key, value in attributes.items()
    ]
    # print("result", result)
    return result


def to_event(event):
    return EventData(
        timeUnixNano=event.timestamp,
        name=event.name,
        attributes=to_key_values(event.attributes),
        # attributes=event.attributes,
        droppedAttributesCount=0,
    )


def to_link(link: Link):
    return LinkData(
        traceId=int_to_hex_str(link.context.trace_id),
        spanId=int_to_hex_str(link.context.span_id),
        traceState=None,
        attributes=link.attributes,
        droppedAttributesCount=0,
    )


def create_status(status_code: StatusCode, description: Optional[str] = None) -> Status:
    if status_code == StatusCode.OK:
        return Status(status_code=status_code)

    return Status(status_code=status_code, description=description)


def int_to_hex_str(num: int) -> str:
    """Convert integer to hex string padded to 16 chars"""
    return format(num, "016x")


def to_span(span: ReadableSpan) -> SpanData:
    print("for all span kind", span.kind.name, span.kind.value)
    return SpanData(
        traceId=int_to_hex_str(span.context.trace_id or 0),
        spanId=int_to_hex_str(span.context.span_id or 0),
        name=span.name,
        kind=SpanKind[span.kind.name],
        startTimeUnixNano=span.start_time,
        endTimeUnixNano=span.end_time,
        attributes=to_key_values(span.attributes),
        droppedAttributesCount=0,
        events=[to_event(event) for event in span.events],
        droppedEventsCount=0,
        links=[to_link(link) for link in span.links],
        droppedLinksCount=0,
        status=create_status(span.status.status_code, span.status.description),
        traceState=None,
        parentSpanId=int_to_hex_str(span.parent.span_id) if span.parent else None,
    )


def to_resource_span(span: ReadableSpan) -> ResourceSpanData:
    print("span", span)
    print("span.resource", span.resource)
    return ResourceSpanData(
        resource=span.resource,
        scopeSpans=[
            ScopeSpanData(
                scope=InstrumentationScopeData(
                    name=span.instrumentation_info.name,
                    version=span.instrumentation_info.version,
                    attributes=None,
                    droppedAttributesCount=None,
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
        for field in items:
            value = getattr(obj, field.name)
            result[field.name] = to_json_serializable(value)
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
class Payload:
    resourceSpans: List[ResourceSpanData]

    def to_json(self):
        return to_json_serializable(self, allow_to_json=False)


class JSONSpanExporter(SpanExporter):
    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def export(self, spans):
        # Convert to JSON format
        # first step is to convert it to IResourceSpans
        # format (as the typescript library expects))
        resource_spans = [to_resource_span(span) for span in spans]
        # span_dicts = [to_resource_span(span) for span in spans]
        # span_dicts = [to_json_readable_span(span) for span in spans]

        payload = Payload(resourceSpans=resource_spans)
        # debug_serialize(payload)

        content = payload.to_json()
        # print("Content", content, json.dumps(content, cls=CustomJSONEncoder))
        json_data = json.dumps(content, cls=CustomJSONEncoder)

        print("Sending data to", self.endpoint)
        print(json_data)
        # Send JSON data to the endpoint
        response = requests.post(
            self.endpoint, data=json_data, headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            return SpanExportResult.SUCCESS
        else:
            return SpanExportResult.FAILURE

    def shutdown(self):
        pass


# def debug_serialize(obj, path="root"):
#     if isinstance(obj, dict):
#         for key, value in obj.items():
#             debug_serialize(value, f"{path}.{key}")
#     elif isinstance(obj, (list, tuple)):
#         for i, value in enumerate(obj):
#             debug_serialize(value, f"{path}[{i}]")
#     else:
#         try:
#             json.dumps(obj)
#         except TypeError:
#             print(f"Cannot serialize at {path}: {type(obj)} = {obj}")


def instrument(instance: FastAPI):
    """
    This function returns a patched instance of the fastAPI app.

    All requests to the app will be automatically traced.
    """

    setup_tracer_provider(endpoint="http://localhost:8788/v1/traces")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Set up before startup
        print("Starting up")
        yield
        # Clean up after shutdown
        print("Shutting down")

    instance.router.lifespan_context = lifespan

    async def middleware(request: Request, call_next):
        # print("middleware")
        # measured_next = call_next
        measured_next = measure(
            call_next,
            on_start=set_request_attributes,
            on_success=on_success,
        )
        # with trace.get_tracer(__name__).start_as_current_span(
        #     "request", kind=trace.SpanKind.SERVER
        # ) as span:

        # start_time = time.perf_counter()
        response = await measured_next(request)
        # if response.status_code >= 400:
        #     span.set_status(status=StatusCode.ERROR, description="Error response")
        # else:
        #     span.set_status(status=StatusCode.OK)

        return response

    instance.middleware("http")(middleware)
    # instance.add_middleware(middleware)
    print("Added middleware")
    return instance


# def measure()


async def on_success(span: Span, response: Response):
    """Handle successful response with span updates"""
    span.add_event("first-response")

    # FastAPI Response objects can't be cloned, but we can access attributes directly
    # attributes_response = response

    async def update_span(response: Response):
        attributes = await get_response_attributes(response)
        print("attributes", attributes)
        span.set_attributes(attributes)
        # span.end()

    await update_span(response)


class CustomJSONEncoder(json.JSONEncoder):
    def encode(self, obj):
        if isinstance(obj, dict):
            # Preserve keys with dashes
            return (
                "{"
                + ", ".join(f'"{k}": {self.encode(v)}' for k, v in obj.items())
                + "}"
            )
        elif isinstance(obj, list):
            return "[" + ", ".join(self.encode(e) for e in obj) + "]"
        return super().encode(obj)
