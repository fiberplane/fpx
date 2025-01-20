import sys
from typing import TextIO

from fastapi import FastAPI
from opentelemetry import trace
from starlette.middleware.base import BaseHTTPMiddleware
<<<<<<< HEAD
from .utils import safely_serialize_json


class SpanAwareOutput:
    def __init__(self, original: TextIO, level: str):
        self.original = original
=======


class SpanAwareOutput:
    def __init__(self, original_stdout: TextIO, level: str):
        self.original_stdout = original_stdout
>>>>>>> origin/main
        self.current_line: list[str] = []
        self.level = level

    def write(self, text: str):
        # Always write to the original stdout
<<<<<<< HEAD
        self.original.write(text)
=======
        self.original_stdout.write(text)
>>>>>>> origin/main

        # Accumulate the text
        self.current_line.append(text)

        # If the text ends with a newline, process the complete line
        if text.endswith("\n"):
            complete_line = "".join(self.current_line).rstrip()
            self.current_line = []  # Reset for next line

            if complete_line.strip():  # Only process non-empty lines
                span = trace.get_current_span()
                if span.is_recording():
<<<<<<< HEAD
                    message = complete_line
                    span.add_event(
                        name="log",
                        attributes={
                            "message": message,
                            "level": self.level,
                            "arguments": safely_serialize_json([]),
                            "source": "stoud/stderr",
                        },
=======
                    span.add_event(
                        name="log",
                        attributes={"message": complete_line, "level": self.level},
>>>>>>> origin/main
                    )

    def flush(self):
        # If there's any remaining text, process it
        if self.current_line:
            complete_line = "".join(self.current_line).rstrip()
            if complete_line.strip():
                span = trace.get_current_span()
                if span.is_recording():
<<<<<<< HEAD
                    message = complete_line
                    span.add_event(
                        name="log",
                        attributes={
                            "message": message,
                            "level": self.level,
                            "arguments": safely_serialize_json([]),
                            "source": "stoud/stderr",
                        },
                    )
            self.current_line = []
        self.original.flush()
=======
                    span.add_event(
                        name="log",
                        attributes={"message": complete_line, "level": self.level},
                    )
            self.current_line = []
        self.original_stdout.flush()
>>>>>>> origin/main


class RealtimePrintCaptureMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI):
        super().__init__(app)
        # Store the original stdout when the middleware is initialized
        self.original_stdout = sys.stdout
        # Replace stdout with our custom wrapper
        sys.stdout = SpanAwareOutput(self.original_stdout, "info")
        self.original_stderr = sys.stderr
        # Replace stderr with our custom wrapper
        sys.stderr = SpanAwareOutput(self.original_stderr, "error")

    async def dispatch(self, request, call_next):
        # We don't need to do any stdout manipulation here
        # since it's already handled by our SpanAwareOutput
        response = await call_next(request)
        return response

    def __del__(self):
        # Restore original stdout when the middleware is destroyed
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr


def setup_capture_print_middleware(app: FastAPI):
    app.add_middleware(RealtimePrintCaptureMiddleware)
