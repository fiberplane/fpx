from typing import Union
import logging
import json
import asyncio

from time import sleep

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fpxpy import measure, setup

# Example logger
logger = logging.getLogger(__name__)
# Set the log level to log everything
logger.setLevel(logging.DEBUG)

app = FastAPI()
setup(app)

@app.get("/")
def read_root():
    """
    Example index that returns a JSON object
    """
    loop()
    return {"Hello": "World"}


@measure()
def loop(n: int = 10) -> None:
    for i in range(n):
        sleep(0.1)
        # Log the loop number
        # This will be captured by FPX
        # Unfortunately this will not appear in the terminal console
        # When using `FPX_ENDPOINT=http://localhost:8788/v1/traces  uv run fastapi dev ./main.py`
        print(f"Loop number: %i" % i)


@app.get("/hello")
async def root():
    return {"message": "Hello World"}


@app.get("/sse")
def sse():
    return StreamingResponse(generate_data_events(), media_type="text/event-stream")

@measure()
async def generate_data_events(n: int = 10):
    for value in range(n):
        await asyncio.sleep(0.1)
        data = json.dumps({
            "value": value
        })
        print(f"Loop number: %i" % value)
        yield f"data: event {data}\n\n"



@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    """
    Endpoint that returns JSON object with some of the parameters
    Args:
        item_id (int): _description_
        q (Union[str, None], optional): _description_. Defaults to None.

    Returns:
        _type_: _description_
    """
    return {"item_id": item_id, "q": q}
