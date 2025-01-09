"""Implementation of the JSON Span Exporter"""

from dataclasses import dataclass
from logging import getLogger
from typing import Any, List, Optional

import requests
from dataclasses_json import LetterCase, dataclass_json
from opentelemetry.sdk.resources import Attributes, Resource
from opentelemetry.sdk.trace import Event, ReadableSpan, StatusCode
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult
from opentelemetry.trace import Link, SpanKind, Status


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class KeyValueData:
    # /** KeyValue key */
    key: str
    # /** KeyValue value */
    value: Any


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ScopeSpanData:
    scope: Optional["InstrumentationScopeData"] = None
    spans: Optional[List["ReadableSpanData"]] = None
    schema_url: Optional[str] = None

    @classmethod
    def from_span(cls, span: ReadableSpan):
        return cls(
            scope=InstrumentationScopeData.from_span(span),
            spans=[ReadableSpanData.from_span(span)],
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ResourceSpanData:
    scope_spans: List[ScopeSpanData]
    resource: Optional[Resource] = None
    schema_url: Optional[str] = None

    @classmethod
    def from_span(cls, span: ReadableSpan):
        return cls(
            scope_spans=[
                ScopeSpanData.from_span(span),
            ],
            resource=ResourceData.from_resource(span.resource),
            schema_url=None,
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class SpansPayload:
    resource_spans: List[ResourceSpanData]


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ResourceData:
    attributes: List[KeyValueData]
    schema_url: Optional[str] = None

    @classmethod
    def from_resource(cls, resource: Resource):
        return cls(
            attributes=to_key_values(resource.attributes),
            schema_url=resource.schema_url,
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class EventData:
    time_unix_nano: float
    name: str
    attributes: List[KeyValueData]
    dropped_attributes_count: int

    @classmethod
    def from_event(cls, event: Event):
        return cls(
            time_unix_nano=event.timestamp,
            name=event.name,
            attributes=(
                to_key_values(event.attributes) if event.attributes is not None else []
            ),
            dropped_attributes_count=0,
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class LinkData:
    trace_id: str
    span_id: str
    trace_state: Optional[str]
    attributes: List[KeyValueData]
    dropped_attributes_count: int

    @classmethod
    def from_link(cls, link: Link):
        return cls(
            trace_id=int_to_hex_str(link.context.trace_id),
            span_id=int_to_hex_str(link.context.span_id),
            trace_state=None,
            attributes=(
                to_key_values(link.attributes) if link.attributes is not None else []
            ),
            dropped_attributes_count=0,
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class InstrumentationScopeData:
    name: str
    version: Optional[str]
    attributes: Optional[List[KeyValueData]]
    dropped_attributes_count: Optional[int]

    @classmethod
    def from_span(cls, span: ReadableSpan):
        return cls(
            name=span.instrumentation_info.name,
            version=span.instrumentation_info.version,
            attributes=None,
            dropped_attributes_count=None,
        )


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class StatusData:
    code: StatusCode
    description: Optional[str] = None

    @classmethod
    def from_status(cls, status: Status) -> "StatusData":
        return cls(code=status.status_code, description=status.description)


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ReadableSpanData:
    trace_id: str
    span_id: str
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
    status: StatusData
    trace_state: Optional[str] = None
    parent_span_id: Optional[str] = None

    @classmethod
    def from_span(cls, span: ReadableSpan) -> "ReadableSpanData":
        return cls(
            trace_id=int_to_hex_str(span.context.trace_id or 0),
            span_id=int_to_hex_str(span.context.span_id or 0),
            name=span.name,
            kind=SpanKind[span.kind.name],
            start_time_unix_nano=(
                float(span.start_time) if span.start_time is not None else 0.0
            ),
            end_time_unix_nano=(
                float(span.end_time) if span.end_time is not None else 0.0
            ),
            attributes=(
                to_key_values(span.attributes) if span.attributes is not None else []
            ),
            dropped_attributes_count=0,
            events=[EventData.from_event(event) for event in span.events],
            dropped_events_count=0,
            links=[LinkData.from_link(link) for link in span.links],
            dropped_links_count=0,
            status=StatusData.from_status(span.status),
            trace_state=None,
            parent_span_id=int_to_hex_str(span.parent.span_id) if span.parent else None,
        )


def to_key_values(attributes: Attributes):
    result = [
        KeyValueData(key=key, value={"stringValue": value})
        for key, value in attributes.items()
    ]
    return result


def int_to_hex_str(num: int) -> str:
    """Convert integer to hex string padded to 16 chars"""
    return format(num, "016x")


class JSONSpanExporter(SpanExporter):
    def __init__(self, endpoint: str):
        self.endpoint = endpoint

    def export(self, spans):
        logger = getLogger("fpxpy")
        resource_spans = [ResourceSpanData.from_span(span) for span in spans]
        payload = SpansPayload(resource_spans=resource_spans)
        content = payload.to_json()

        try:
            response = requests.post(
                self.endpoint,
                data=content,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            if response.status_code == 200:
                logger.info("Successfully sent spans to %s", self.endpoint)
                return SpanExportResult.SUCCESS
            logger.error("Received status code %s", response.status_code)
        except requests.Timeout:
            # TODO: implement back off and retry
            logger.error("Timeout while sending spans to %s", self.endpoint)
        except requests.ConnectionError:
            logger.error("Failed to connect to %s", self.endpoint)

        return SpanExportResult.FAILURE

    def shutdown(self):
        pass
