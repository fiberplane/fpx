from typing import Union
import inspect

from fastapi import FastAPI
from fpxpy import measure, setup

app = FastAPI()
setup(app)


@app.get("/")
def read_root():
    """
    Example index that returns a JSON object
    """
    loop()
    return {"Hello": "World"}


@measure(name="loop")
def loop(n: int = 10) -> None:
    for i in range(n):
        print("loop", i)


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
