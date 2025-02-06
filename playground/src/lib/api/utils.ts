export async function safeParseBodyText(response: Response) {
  try {
    return await response.text();
  } catch (_error) {
    return undefined;
  }
}
