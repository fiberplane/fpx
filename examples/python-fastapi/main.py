from typing import Union
import logging

from time import sleep

from fastapi import FastAPI
from fpxpy import measure, setup


app = FastAPI()
# Set capture_stdout_stderr to False to avoid capturing prints/terminal output
# as if they were logs
setup(app, capture_stdout_stderr=True)

# Example logger
logger = logging.getLogger(__name__)
# Set the log level to log everything
logger.setLevel(logging.DEBUG)


@app.get("/")
def read_root():
    """
    Example index that returns a JSON object
    """
    loop()
    return {"Hello": "World"}


@measure()
def loop(n: int = 10) -> None:
    logger.info("Loop started with extra", extra={"n": n})
    for i in range(n):
        sleep(0.1)
        # Log the loop number
        # This will be captured by FPX
        # Unfortunately this will not appear in the terminal console
        # When using `FPX_ENDPOINT=http://localhost:8788/v1/traces  uv run fastapi dev ./main.py`

        # When using `uv run fastapi dev ./main.py` this logger statement
        # will only appear as events of the span in the Fiberplane UI
        logger.info(f"Loop number: {i}")


@app.get("/hello")
async def root():
    return {"message": "Hello World"}


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
