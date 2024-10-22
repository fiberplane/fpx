export async function getUser() {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    name: "John Doe",
    email: "john@doe.com",
  }
}
