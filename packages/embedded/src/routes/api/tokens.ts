import { Hono } from "hono";

type Token = {
  id: string;
  token: string;
};

const tokens: Array<Token> = [
  {
    id: "1234",
    token: "abc123",
  },
  {
    id: "5678",
    token: "def456",
  },
  {
    id: "91011",
    token: "ghi789",
  },
  {
    id: "121314",
    token: "jkl012",
  },
];

export default function createTokensApiRoute(apiKey: string) {
  const app = new Hono();

  app.get("/", (c) => c.json({ tokens }));

  app.get("/:id", (c) => {
    const id = c.req.param("id");

    const token = tokens.filter((token) => token.id === id);

    return c.json({ token });
  });

  return app;
}
