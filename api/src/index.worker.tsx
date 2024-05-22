import { neon } from "@neondatabase/serverless";

import { createApp } from './app'
import { Messages } from "./components";

const app = createApp();

// Home page - added here because jsx not okay when running in node.js
//
app.get("/", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const logs = await sql("SELECT * FROM mizu_logs");
  return c.html(<Messages logs={logs} />);
});

export default app;