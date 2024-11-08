import { measure } from "@fiberplane/hono-otel";

const sleep = (duration = 100) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export const getUser = measure("getUser", async () => {
  await sleep();
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
