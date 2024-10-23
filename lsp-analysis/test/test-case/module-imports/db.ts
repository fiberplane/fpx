import { sleep } from ".";

export const getUser = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    name: "John Doe",
    email: "john@doe.com",
  };
};

export async function getProfile() {
  const user = await getUser();
  await sleep(10);
  return {
    ...user,
    image: "https://xsgames.co/randomusers/avatar.php?g=pixel",
  };
}
