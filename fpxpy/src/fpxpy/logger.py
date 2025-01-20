import logging
from typing import Callable, Optional

from opentelemetry.trace import get_current_span
from .utils import safely_serialize_json, extract_extra_params

logger = logging.getLogger("fpxpy")


class LogSnooper(logging.Handler):
    """Snoop on log messages by storing them in a list"""

    def emit(self, record: logging.LogRecord) -> None:
        span = get_current_span()

        if span and span.is_recording():
            message = record.getMessage()
            span.add_event(
                "log",
                {
                    "message": message,
                    "level": convert_log_level(record.levelname.lower()),
                    "arguments": safely_serialize_json([extract_extra_params(record)]),
                    "module": record.module,
                    "filename": record.filename,
                    "lineno": record.lineno,
                    "source": "logging",
                    # "arguments": [message],
                },
            )


def capture_logs(logger_name: Optional[str] = None) -> Callable[[], None]:
    """
    Creates and attaches a log snooper to the specified logger

    Returns a teardown function that removes the log snooper from the logger
    """
    snooper = LogSnooper()
    global_logger = (
        logging.getLogger(logger_name) if logger_name else logging.getLogger()
    )
    global_logger.addHandler(snooper)

    def teardown_logs() -> None:
        """
        Removes the log snooper from the logger
        """
        global_logger.removeHandler(snooper)

    return teardown_logs


def convert_log_level(level: str) -> str:
    """
    Get the log level from a string
    """
    if level == "debug":
        return "debug"
    if level == "warning":
        return "warn"
    if level == "error":
        return "error"

    return "info"
