import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { initDbConnect } from "../../db";
import { decrementAiCredits, fpAuthenticate } from "../../lib";
import type { FpAuthApp } from "../../types";
import { generateRequest } from "./service";
import { GenerateRequestOptionsSchema } from "./types";

const app = new Hono<FpAuthApp>();

app.post(
  "/request",
  fpAuthenticate,
  zValidator("json", GenerateRequestOptionsSchema),
  async (c) => {
    const currentUser = c.get("currentUser");
    if (!currentUser) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const db = initDbConnect(c.env.DB);

    try {
      const requestOptions = c.req.valid("json");
      const aiResult = await generateRequest({
        apiKey: c.env.OPENAI_API_KEY,
        ...requestOptions,
      });
      if (aiResult.error) {
        return c.json({ error: { message: "Error generating request " } }, 500);
      }
      // NOTE - Enqueue the ai credit derementing promise for after the worker finishes
      c.executionCtx.waitUntil(decrementAiCredits(db, currentUser.id));
      return c.json(aiResult);
    } catch (error) {
      console.error("Error processing request generation call", error);
      return c.json(
        {
          message: "Unknown error",
        },
        500,
      );
    }
  },
);

export default app;
