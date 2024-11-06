import { Hono } from "hono";
import { cors } from "hono/cors";
import { getProfile, getUser } from "./db";

const app = new Hono();

app.get(
  "/",
  // Use middleware as often inside a cloudflare worker
  () => cors(),
  (c) => c.text("Hello, Hono!"),
);

// Internally declared function
export async function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

// Endpoint that calls locally declared function
app.get("/slow", cors(), async (c) => {
  await sleep(1000);
  return c.text("Hello, Hono (slow)!");
});

// // Endpoint that calls imported function from relative path
// app.get("user/1/profile", cors(), async (c) => {
//   // await getUser();
//   const userDetails = await getProfile();
//   return c.json(userDetails);
// });

// Endpoint that calls imported function from relative path
app.get("user/1", cors(), async (c) => {
  // await getUser();
  const user = await getUser();
  return c.json(user);
});

export default app;
