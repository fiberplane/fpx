import { measure } from "@fiberplane/hono-otel";
import { sleep } from ".";
import type { User } from "./types";

export const getUser = measure("getUser", async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const value: User = {
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
