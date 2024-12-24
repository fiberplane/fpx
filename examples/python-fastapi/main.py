from typing import Union

from fastapi import FastAPI
from fpxpy import setup

app = FastAPI()
setup(app)


@app.get("/")
def read_root():
    """
    Example index that returns a JSON object
    """
    for i in range(10):
        print("loop", i)
    # span.set_status(trace.StatusCode.OK, "All done")
    return {"Hello": "World"}


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
