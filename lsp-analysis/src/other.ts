import { Hono } from "hono";
export { Hono as App } from "hono";
// export const App = Hono;
const app = new Hono();
console.log("app", app);
// const app2 = new Hono();
// export type SuperHono = Hono & { super: boolean };
// export const App = Hono;
