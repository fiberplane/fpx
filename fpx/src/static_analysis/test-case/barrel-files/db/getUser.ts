import { measure } from "@fiberplane/hono-otel";
import type { User } from "../types";
import { sleep } from "../utils";

const DEFAULT_USER_NAME = "John Doe";
const DEFAULT_EMAIL = "john@doe.com";

export const getUser = measure("getUser", async () => {
  await sleep(100);
  const value: User = {
    name: DEFAULT_USER_NAME,
    email: DEFAULT_EMAIL,
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
