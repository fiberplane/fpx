import functools
import asyncio
import inspect
from typing import (
    Callable,
    Optional,
    TypeVar,
    Union,
    ParamSpec,
    Concatenate,
    overload,
    Awaitable,
    Coroutine,
    Any,
    cast,
)

# from collections.abc import Coroutine as CoroutineType
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode, SpanKind, Span
from opentelemetry.sdk.resources import Attributes

ReturnValue = TypeVar("ReturnValue")
Params = ParamSpec("Params")

# /**
#  * Allows you to specify a function that will be called when the span ends
#  * and will be passed the span & result of the function being measured.
#  *
#  * This way you can do things like add additional attributes to the span
#  */
# onSuccess?: (
#   span: Span,
#   result: ExtractInnerResult<RESULT>,
# ) => RESULT extends Promise<unknown> ? Promise<void> | void : void;

# /**
#  * This is an advanced feature in cases where you don't want the open telemetry spans
#  * to be ended automatically.
#  *
#  * Some disclaimers: this can only be used in combination with promises and with an onSuccess
#  *  handler. This handler should call span.end() at some point. If you want the on success
#  * handler to trigger another async function you may want to use waitUntil to prevent the
#  * worker from terminating before the traces/spans are finished & send to the server
#  *
#  * How this is currently used;:
#  * We're using it to show the duration of a request in case it's being streamed back to
#  * the client. In those cases the response is returned early while work is still being done.
#  *
#  */
# endSpanManually?: boolean;

# /**
#  * Allows you to specify a function that will be called when the span ends
#  * with an error and will be passed the (current) span & error that occurred.
#  *
#  * This way you can do things like add additional attributes to the span
#  */
# onError?: (span: Span, error: unknown) => void;

# /**
#  * You can specify a function that will allow you to throw an error based on the value of the
#  * result (returned by the measured function). This error will only be used for recording the error
#  * in the span and will not be thrown.
#  */
# checkResult?: (
#   result: ExtractInnerResult<RESULT>,
# ) => RESULT extends Promise<unknown>
#   ? Promise<void> | void
#   : RESULT extends AsyncGenerator<unknown, unknown, unknown>
#     ? Promise<void> | void
#     : void;

# Type for the callback that gets both Span and original function params
OnStartCallback = Callable[Concatenate[Span, Params], None]


@overload
def measure(
    name: Optional[str],
    func: Callable[Params, ReturnValue],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Optional[Callable[[Span, ReturnValue], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[Params, ReturnValue]: ...


@overload
def measure(
    name: Optional[str],
    func: Callable[Params, Coroutine[Any, Any, ReturnValue]],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Optional[
        Callable[[Span, ReturnValue], Union[None, Coroutine[Any, Any, Any]]]
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[Params, Coroutine[Any, Any, ReturnValue]]: ...


@overload
def measure(
    name: str,
    func: Optional[None] = None,
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Optional[Callable[[Span, ReturnValue], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[
    [Callable[Params, ReturnValue]],
    Callable[Params, ReturnValue],
]: ...


# @overload
# def measure(
#     name_or_fn: str,
#     span_kind: SpanKind = SpanKind.INTERNAL,
#     on_start: Optional[OnStartCallback[Params]] = None,
#     on_success: Optional[Callable[[Span, Coroutine[Any, Any, ReturnValue]], None]] = None,
#     on_error: Optional[Callable[[Span, Exception], None]] = None,
#     attributes: Optional[Attributes] = None,
# ) -> Callable[
#     [Callable[Params, Awaitable[ReturnValue]]],
#     Callable[Params, Awaitable[ReturnValue]],
# ]: ...


def measure(
    name: Optional[str] = None,
    func: Optional[
        Union[
            Callable[Params, ReturnValue],
            Callable[Params, Coroutine[Any, Any, ReturnValue]],
        ]
    ] = None,
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Optional[
        Union[
            Callable[
                [Span, ReturnValue],
                None,
            ],
            Callable[
                [Span, ReturnValue],
                Union[None, Coroutine[Any, Any, Any]],
            ],
        ],
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Union[
    Callable[Params, ReturnValue],
    Callable[Params, Coroutine[Any, Any, ReturnValue]],
    Callable[[Callable[Params, ReturnValue]], Callable[Params, ReturnValue]],
    Callable[
        [Callable[Params, Coroutine[Any, Any, ReturnValue]]],
        Callable[Params, Coroutine[Any, Any, ReturnValue]],
    ],
]:
    """
    Wraps a function in a span, measuring the time it takes to execute.
    Can be used as a decorator or called directly.

    Args:
        name_or_fn: Function name or the function itself
        span_kind: Kind of span (default: INTERNAL)
        attributes: Optional span attributes
    """

    # @overload
    def wrap_function(
        fn: Union[
            Callable[Params, ReturnValue],
            Callable[Params, Coroutine[Any, Any, ReturnValue]],
        ],
    ) -> Union[
        Callable[Params, ReturnValue],
        Callable[Params, Coroutine[Any, Any, ReturnValue]],
    ]:
        is_coroutine = inspect.iscoroutinefunction(fn)
        current_name = name or fn.__name__

        @functools.wraps(fn)
        async def async_wrapper(*args: Params.args, **kwargs: Params.kwargs):
            tracer = trace.get_tracer("fpx-tracer")

            with tracer.start_as_current_span(
                name=current_name,
                kind=span_kind,
                attributes=attributes,
            ) as span:
                if on_start:
                    on_start(span, *args, **kwargs)
                try:
                    result = fn(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    if on_success:
                        value = (
                            result if not inspect.isawaitable(result) else await result
                        )
                        success = on_success(span, value)
                        if inspect.isawaitable(success):
                            asyncio.run(success)
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    if on_error:
                        on_error(span, e)
                    raise e

        @functools.wraps(fn)
        def sync_wrapper(*args: Params.args, **kwargs: Params.kwargs):
            tracer = trace.get_tracer("fpx-tracer")
            with tracer.start_as_current_span(
                name=current_name,
                kind=span_kind,
                attributes=attributes,
            ) as span:
                if on_start:
                    on_start(span, *args, **kwargs)
                try:
                    result = fn(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    if on_success:
                        value = (
                            asyncio.get_event_loop().run_until_complete(result)
                            if inspect.isawaitable(result)
                            else result
                        )
                        success = on_success(span, value)
                        if inspect.isawaitable(success):
                            loop = asyncio.get_event_loop()
                            loop.run_until_complete(success)
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    if on_error:
                        on_error(span, e)
                    raise e

        return async_wrapper if is_coroutine else sync_wrapper

    # Used as decorator without parameters @measure
    if func is None:
        return cast(
            Union[
                Callable[
                    [Callable[Params, ReturnValue]],
                    Callable[Params, ReturnValue],
                ],
                Callable[
                    [Callable[Params, Coroutine[Any, Any, ReturnValue]]],
                    Callable[Params, Coroutine[Any, Any, ReturnValue]],
                ],
            ],
            wrap_function,
        )

    return wrap_function(func)
