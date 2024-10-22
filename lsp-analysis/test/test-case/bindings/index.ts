import { Hono } from "hono";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GOOSE_AVATARS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  const headers = new Headers();
  c.env.GOOSE_AVATARS.put("test", new ReadableStream(), {
    httpMetadata: { contentType: "application/json" },
  });
  console.log('headers', headers);
  return c.text("Hello, Hono!")
});

export default app;
