import path from "node:path";
import { measure } from "@fiberplane/hono-otel";

const sleep = (duration = 100) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export const getUser = measure("getUser", async () => {
  await sleep();

  // Do something silly with the path module
  const parent = path.resolve(__dirname, "..");
  console.log("parent folder", parent);
  const value = {
    name: "John Doe",
    email: "john@doe.com",
  };
  return value;
});

export async function getProfile() {
  const user = await getUser();
  await sleep(10);
  return {
    ...user,
    image: "https://xsgames.co/randomusers/avatar.php?g=pixel",
  };
}
