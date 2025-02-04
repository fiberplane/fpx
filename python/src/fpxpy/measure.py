import functools
import asyncio
import inspect
import time
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
    Iterator,
    AsyncIterator,
)

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode, SpanKind, Span
from opentelemetry.sdk.resources import Attributes

R = TypeVar("R")
P = ParamSpec("P")
T = TypeVar("T")  # Type for iterator elements

# Type for the callback that gets both Span and original function params
OnStartCallback = Callable[Concatenate[Span, P], None]


@overload
def measure(
    name: str,
    *,  # Force named parameters after name
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Any]] = None,
    on_success: Optional[Callable[[Span, Any], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[Callable[[Any], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]: ...


@overload
def measure(
    *,  # Force named parameters after name
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[Any]] = None,
    on_success: Optional[Callable[[Span, Any], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[Callable[[Any], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]: ...


@overload
def measure(
    name: Optional[str],
    func: Callable[P, Coroutine[Any, Any, R]],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[P]] = None,
    on_success: Optional[
        Callable[[Span, R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[
        Callable[[R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[P, Coroutine[Any, Any, R]]: ...


@overload
def measure(
    name: Optional[str],
    func: Callable[P, R],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[P]] = None,
    on_success: Optional[Callable[[Span, R], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[Callable[[R], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[P, R]: ...


@overload
def measure(
    name: str = "measure",
    func: None = None,
    *,
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[P]] = None,
    on_success: Optional[
        Callable[[Span, R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[
        Callable[[R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]: ...


@overload
def measure(
    name: Optional[str],
    func: Callable[P, Union[Iterator[T], AsyncIterator[T]]],
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[P]] = None,
    # on_yield: Optional[Callable[Span, T], None] = None,
    on_success: Optional[Callable[[Span, T], None]] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[Callable[[T], None]] = None,
    attributes: Optional[Attributes] = None,
) -> Callable[P, Union[Iterator[T], AsyncIterator[T]]]: ...


def measure(
    name: Optional[str] = None,
    func: Optional[Callable[P, Union[R, Coroutine[Any, Any, R], Iterator[T], AsyncIterator[T]]]] = None,
    span_kind: SpanKind = SpanKind.INTERNAL,
    on_start: Optional[OnStartCallback[P]] = None,
    # on_yield: Optional[Callable[Span, T], None] = None,
    on_success: Optional[
        Callable[[Span, R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    on_error: Optional[Callable[[Span, Exception], None]] = None,
    check_result: Optional[
        Callable[[R], Union[None, Coroutine[Any, Any, None]]]
    ] = None,
    attributes: Optional[Attributes] = None,
) -> Union[
    Callable[P, R],
    Callable[P, Coroutine[Any, Any, R]],
    Callable[[Callable[P, R]], Callable[P, R]],
    Callable[P, Iterator[T]],
    Callable[P, AsyncIterator[T]],
]:
    """
    Wraps a function in a span, measuring the time it takes to execute.
    Can be used as a decorator or called directly.

    Args:
        name_or_fn: Function name or the function itself
        span_kind: Kind of span (default: INTERNAL)
        attributes: Optional span attributes
    """

    def wrap_function(
        fn: Union[
            Callable[P, R],
            Callable[P, Coroutine[Any, Any, R]],
            Callable[P, Iterator[T]],
            Callable[P, AsyncIterator[T]],
        ],
    ) -> Union[
        Callable[P, R],
        Callable[P, Coroutine[Any, Any, R]],
        Callable[P, Iterator[T]],
        Callable[P, AsyncIterator[T]],
    ]:
        is_coroutine = inspect.iscoroutinefunction(fn)
        is_generator = inspect.isgeneratorfunction(fn)
        is_async_generator = inspect.isasyncgenfunction(fn)
        current_name = name or fn.__name__

        @functools.wraps(fn)
        async def async_generator_wrapper(*args: P.args, **kwargs: P.kwargs):
            tracer = trace.get_tracer("fpx-tracer")
            
            with tracer.start_as_current_span(
                name=current_name,
                kind=span_kind,
                attributes=attributes,
            ) as parent_span:
                if on_start:
                    on_start(parent_span, *args, **kwargs)
                try:
                    async_gen = fn(*args, **kwargs)

                    iteration = 0
                    iteration_start = time.time_ns()
                    async for value in async_gen:
                        with tracer.start_as_current_span(
                            name=f"{current_name}[{iteration}]",
                            kind=span_kind,
                            attributes=attributes,
                            start_time=iteration_start,
                        ) as span:
                            yield value
                            span.set_status(Status(StatusCode.OK))
                        iteration_start = time.time_ns()
                        iteration += 1

                    parent_span.set_status(Status(StatusCode.OK))

                except Exception as e:
                    parent_span.set_status(Status(StatusCode.ERROR, str(e)))
                    parent_span.record_exception(e)
                    if on_error:
                        on_error(parent_span, e)
                    raise e

        @functools.wraps(fn)
        def sync_generator_wrapper(*args: P.args, **kwargs: P.kwargs):
            tracer = trace.get_tracer("fpx-tracer")
            
            with tracer.start_as_current_span(
                name=current_name,
                kind=span_kind,
                attributes=attributes,
            ) as parent_span:
                if on_start:
                    on_start(parent_span, *args, **kwargs)
                try:
                    gen = fn(*args, **kwargs)
                    iteration = 0
                    iteration_start = time.time_ns()
                    for value in gen:
                        with tracer.start_as_current_span(
                            name=f"{current_name}[{iteration}]",
                            kind=span_kind,
                            attributes=attributes,
                            start_time=iteration_start,
                        ) as span:
                            if check_result:
                                try:
                                    check = check_result(value)
                                    if inspect.iscoroutine(check):
                                        loop = asyncio.get_event_loop()
                                        loop.run_until_complete(check)
                                except Exception as e:
                                    span.set_status(Status(StatusCode.ERROR, str(e)))
                                    span.record_exception(e)
                                    if on_error:
                                        on_error(span, e)
                                    yield value
                                    continue

                            span.set_status(Status(StatusCode.OK))
                            if on_success:
                                success = on_success(span, value)
                                if inspect.isawaitable(success):
                                    loop = asyncio.get_event_loop()
                                    loop.run_until_complete(success)
                            yield value
                            iteration_start = time.time_ns()

                        iteration += 1
                    parent_span.set_status(Status(StatusCode.OK))

                except Exception as e:
                    parent_span.set_status(Status(StatusCode.ERROR, str(e)))
                    parent_span.record_exception(e)
                    if on_error:
                        on_error(parent_span, e)
                    raise e

        @functools.wraps(fn)
        async def async_wrapper(*args: P.args, **kwargs: P.kwargs):
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
                    if check_result:
                        try:
                            check = check_result(value)
                            if inspect.iscoroutine(check):
                                await check
                        except Exception as e:
                            span.set_status(Status(StatusCode.ERROR, str(e)))
                            span.record_exception(e)
                            if on_error:
                                on_error(span, e)

                            return value

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
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs):
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
                    if check_result:
                        try:
                            check = check_result(value)
                            if inspect.iscoroutine(check):
                                loop = asyncio.get_event_loop()
                                loop.run_until_complete(check)
                        except Exception as e:
                            span.set_status(Status(StatusCode.ERROR, str(e)))
                            span.record_exception(e)
                            if on_error:
                                on_error(span, e)
                            return value

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

        if is_async_generator:
            return async_generator_wrapper
        elif is_generator:
            return sync_generator_wrapper
        elif is_coroutine:
            return async_wrapper
        else:
            return sync_wrapper

    # Used as decorator without passing a function in directly
    if func is None:
        return cast(
            Callable[[Callable[P, R]], Callable[P, R]],
            wrap_function,
        )

    return wrap_function(
        cast(Union[Callable[P, R], Callable[P, Coroutine[Any, Any, R]], Callable[P, Iterator[T]], Callable[P, AsyncIterator[T]]], func)
    )
