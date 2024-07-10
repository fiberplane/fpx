friendy_prompt = """\
You are a code debugging assistant for apps that use Hono (web framework), 
Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
You need to help craft a request to route handlers. 
You will be provided the source code for handlers, and you should generate
query parameters and a request body that will test the request.

Be clever and creative with test data. Avoid just writing things like "test".

For example, if you get a route like `/users/:id`, you should return a URL like:
`/users/1234567890` and a routeParams parameter like this:

{ "routeParams": { "key": ":id", "value": "1234567890" } }
"""

qa_prompt = """\
You are an expert QA Engineer and code debugging assistant for apps that use Hono (web framework), 
Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.

You need to help craft a request to route handlers. 
You will be provided the source code for handlers, and you should generate
query parameters and a request body that will test the request.

Be clever and creative with test data. Avoid just writing things like "test".

For example, if you get a route like `/users/:id`, you should return a URL like:
`/users/1234567890` and a routeParams parameter like this:

{ "routeParams": { "key": ":id", "value": "1234567890" } }

You should focus on trying to break things. You are a QA. 
You are the enemy of bugs. To protect quality, you must find bugs.
Try things like specifying invalid data, or missing data, or invalid data types,
or extremely long data. Try to break the system. Return as many test cases as needed to fully test the handler.
"""

brief_prompt = """\
You are an expert QA Engineer and code debugging assistant for apps that use Hono (web framework), 
Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
You need to help craft a request to route handlers. 
You will be provided the source code for handlers, and you should generate
query parameters and a request body that will test the request.
Be clever and creative with test data. Avoid just writing things like "test".
You should focus on trying to break things. You are a QA. 
You are the enemy of bugs. To protect quality, you must find bugs.
Try things like specifying invalid data, or missing data, or invalid data types,
or extremely long data. Try to break the system. Return as many test cases as needed to fully test the handler.
"""

def get_prompt(prompt_type):
    if prompt_type == "friendly":
        return friendy_prompt
    if prompt_type == "qa":
        return qa_prompt
    if prompt_type == "brief":
        return brief_prompt
    raise ValueError("Unknown prompt type")

def fill_template(method, route, handler, prompt, history="No history"):
    system_prompt = {
        "role": "system",
        "content": prompt,
    }
    user_prompt = {
        "role": "user",
        "content": f"""\
I need to make a request to one of my Hono api handlers.

Here are some recent requests/responses, which you can use as inspiration for future requests.

<history>
{history}
</history>

The request you make should be a {method} request to route: {route}

Here is the code for the handler:
`
{handler}
`
""",
    }

    return [
        system_prompt,
        user_prompt,
    ]


def get_prompt_llama(template):
    prompt = ""
    for item in template:
        prompt += f"<|start_header_id|>{item['role']}<|end_header_id|>{item['content']}<|eot_id|>\n"
    prompt += "<|start_header_id|>assistant<|end_header_id|>"
    return prompt

def get_prompt_gemma(template):
    prompt = "<bos>"
    for item in template:
        prompt += f"<start_of_turn>user\n{item['content']}<end_of_turn>\n"
    prompt += "<start_of_turn>model\n"
    return prompt

def get_template(model):
    normalized = model.lower()
    if "gemma" in normalized:
        return lambda template: get_prompt_gemma(template)
    if "llama" in normalized:
        return lambda template: get_prompt_llama(template)
    raise ValueError("Unknown model")


test_cases = [
    (
        "GET",
        "/api/geese/:id",
        """\
async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const id = c.req.param('id');

  const goose = (await db.select().from(geese).where(eq(geese.id, +id)))?.[0];

  if (!goose) {
    return c.json({ message: 'Goose not found' }, 404);
  }

  return c.json(goose);
}""",
    ),
    (
        "PATCH",
        "/api/geese/:id",
        """\
async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const id = c.req.param('id');
  const { name } = await c.req.json()

  const goose = (await db.update(geese).set({ name }).where(eq(geese.id, +id)).returning())?.[0];

  if (!goose) {
    return c.json({ message: 'Goose not found' }, 404);
  }

  return c.json(goose);
}""",
    ),
]
