import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  TELEGRAM_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Welcome to the Telegram Bot API!");
});


app.post('/webhook', async (c) => {
  const TOKEN = c.env.TELEGRAM_API_TOKEN;
  const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

  const { message } = await c.req.json();
  console.log(message);

  // if (message?.text) {
  //   const chatId = message.chat.id;
  //   const text = message.text;

  //   // Respond to the message using fetch instead of axios
  //   await fetch(`${TELEGRAM_API}/sendMessage`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       chat_id: chatId,
  //       text: `You said: ${text}`,
  //     }),
  //   });
  // }

  return c.text('OK', 200);
});

// CRUD for Messages
app.get("/api/messages", async (c) => {
  const db = drizzle(c.env.DB);
  const messages = await db.select().from(schema.messages);
  return c.json({ messages });
});

app.post("/api/messages", async (c) => {
  const db = drizzle(c.env.DB);
  const { userId, content } = await c.req.json();

  const [newMessage] = await db.insert(schema.messages).values({
    userId: userId,
    content: content,
  }).returning();

  return c.json(newMessage);
});

app.put("/api/messages/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));
  const { content } = await c.req.json();

  const [updatedMessage] = await db.update(schema.messages).set({
    content: content,
  }).where(eq(schema.messages.id, id)).returning();

  return c.json(updatedMessage);
});

app.delete("/api/messages/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = Number.parseInt(c.req.param("id"));

  await db.delete(schema.messages).where(eq(schema.messages.id, id));

  return c.text(`Message with ID ${id} deleted.`);
});

export default instrument(app);