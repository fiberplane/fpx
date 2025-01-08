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

# Type for the callback that gets both Span and original function params
OnStartCallback = Callable[Concatenate[Span, Params], None]


@overload
def measure(
    name: Optional[str],
    func: Callable[Params, Coroutine[Any, Any, ReturnValue]],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Union[
        Callable[[Span, ReturnValue], Coroutine[Any, Any, None]],
        None,
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[Params, Coroutine[Any, Any, ReturnValue]]: ...


@overload
def measure(
    name: Optional[str],
    func: Callable[Params, ReturnValue],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Union[
        Callable[[Span, ReturnValue], None],
        None,
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[Params, ReturnValue]: ...


@overload
def measure(
    name: str,
    func: Optional[None] = None,
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Params]] = None,
    on_success: Union[
        Callable[[Span, ReturnValue], None],
        Callable[[Span, ReturnValue], Coroutine[Any, Any, None]],
        None,
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[
    [Callable[Params, ReturnValue]],
    Callable[Params, ReturnValue],
]: ...


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
    on_success: Union[
        Callable[
            [Span, ReturnValue],
            None,
        ],
        Callable[
            [Span, ReturnValue],
            Union[Coroutine[Any, Any, None]],
        ],
        None,
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
                    value = result if not inspect.isawaitable(result) else await result

                    span.set_status(Status(StatusCode.OK))
                    if on_success:
                        success = on_success(span, value)
                        if inspect.iscoroutine(success):
                            await success
                    return value

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
                    value = (
                        asyncio.get_event_loop().run_until_complete(result)
                        if inspect.isawaitable(result)
                        else result
                    )
                    span.set_status(Status(StatusCode.OK))
                    if on_success:
                        success = on_success(span, value)
                        if inspect.isawaitable(success):
                            loop = asyncio.get_event_loop()
                            loop.run_until_complete(success)
                    return value

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
