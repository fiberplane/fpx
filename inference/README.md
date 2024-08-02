# Local inference server

In this repo you will find a very barebones OpenAI compatible inference server that uses transformers with function calling.
You can use it with FPX Studio for request autofills by selecting OpenAI option with base URL that points to this server (`http://localhost:5000`).

You can use `uv` or `pip` to install the dependencies:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

```sh
uv pip install -r requirements.txt
source .venv/bin/activate
```

To start the server, run:

```sh
python3 main.py
```
