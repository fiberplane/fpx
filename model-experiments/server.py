from quart import Quart, request
from mlx_lm import load, generate

from shared import get_template

app = Quart(__name__)

model_id = "mlx-community/Meta-Llama-3-8B-Instruct-4bit"
model, tokenizer = load(model_id)
format_prompt = get_template(model_id)


@app.post("/chat/completions")
async def chat():
    data = await request.get_json()
    response = generate(model, tokenizer, prompt=format_prompt(data["messages"]), max_tokens=data["max_tokens"], temp=data["temperature"], verbose=True)
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1677652288,
        "model": data["model"],
        "system_fingerprint": "fp_44709d6fcb",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response,
                },
                "logprobs": None,
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 9, "completion_tokens": 12, "total_tokens": 21},
    }


app.run(port=5000)
