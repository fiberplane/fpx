import type { MiddlewareHandler } from "hono";
import { createFactory } from "hono/factory";
import * as jose from "jose";
import { initDbConnect } from "../db";
import type { FpAuthApp } from "../types";
import { importKey } from "./crypto";
import { getUserById } from "./users";

const factory = createFactory();

/**
 * A piece of middleware that handles JWT parsing and user lookup based off of the `sub` of the JWT.
 *
 * Sets variables on the Hono context for the bearerToken and currentUser.
 */
export const fpAuthenticate: MiddlewareHandler<FpAuthApp> =
  factory.createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Invalid or missing Authorization header" }, 401);
    }

    const bearerToken = authHeader.split(" ")?.[1]?.trim();

    if (!bearerToken) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    c.set("bearerToken", bearerToken);

    const publicKey = await importKey("public", c.env.PUBLIC_KEY);

    // TODO - Handle expired tokens
    const verifiedToken = await jose.jwtVerify(bearerToken, publicKey);

    c.set("verifiedToken", verifiedToken.payload);

    const userId = Number.parseInt(verifiedToken?.payload?.sub ?? "");
    if (!userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const db = initDbConnect(c.env.DB);
    const user = await getUserById(db, userId);

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    c.set("currentUser", user);

    await next();
  });
