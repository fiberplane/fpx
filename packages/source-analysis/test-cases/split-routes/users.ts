import { Hono } from "hono";

const users = new Hono();

const USERS = [
  {
    id: 1,
    name: "Alice",
    age: 25,
  },
  {
    id: 2,
    name: "Bob",
    age: 30,
  },
];

users.get("/api/v1/users", (c) => {
  return c.json(USERS);
});

users.get("/api/v1/users/:id", (c) => {
  const id = Number.parseInt(c.req.param("id"));
  const user = USERS.find((u) => u.id === id);
  return c.json(user);
});

export { users };
