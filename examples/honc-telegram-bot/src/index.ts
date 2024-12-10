import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  TELEGRAM_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Welcome to the Telegram Bot API!");
});

app.post("/webhook", async (c) => {
  const TOKEN = c.env.TELEGRAM_API_TOKEN;
  const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

  const { message } = await c.req.json();

  if (message?.text) {
    const chatId = message.chat.id;
    const text = message.text;

    // Respond to the message using fetch
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `You said: ${text}`,
      }),
    });
  }

  return c.text("OK", 200);
});

export default instrument(app);
