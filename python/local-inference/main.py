import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from quart import Quart, request
from quart_cors import cors

from shared import hash, expand

model_id = "meta-llama/Meta-Llama-3.1-8B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id, torch_dtype=torch.bfloat16, device_map="auto"
)

app = Quart(__name__)
app = cors(app, allow_origin="*")


@app.post("/chat/completions")
async def chat():
    data = await request.get_json()
    inputs = tokenizer.apply_chat_template(
        data["messages"],
        tools=data.get("tools", []),
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    )
    output = model.generate(
        **{k: v.to(model.device) for k, v in inputs.items()},
        max_new_tokens=data.get("max_tokens", 1024),
        temperature=data.get("temperature", 0.01),
    )
    response_tokens = output[0][len(inputs["input_ids"][0]):]
    tool_call = tokenizer.decode(response_tokens, skip_special_tokens=True)
    tool_call = json.loads(tool_call)

    # i don't really know why meta decided to use "parameters" instead of "arguments",
    # but for compatibility reasons we'll try both
    arguments = tool_call.get("arguments", tool_call.get("parameters", {}))
    # sometimes llama has the tendency to confuse schema and emit strings instead of objects
    arguments = {k: expand(v) for k, v in arguments.items()}
    arguments = json.dumps(arguments)

    return {
        "id": hash("{created}"),
        "object": "chat.completion",
        "model": model_id,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_" + hash("{created}"),
                            "type": "function",
                            "function": {
                                "name": tool_call["name"],
                                "arguments": arguments,
                            },
                        }
                    ],
                },
                "logprobs": None,
                "finish_reason": "stop",
            }
        ],
    }


if __name__ == "__main__":
    app.run(port=5000)
