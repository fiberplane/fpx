/**
 * Clean a prompt by trimming whitespace for each line and joining the lines.
 */
export function cleanPrompt(prompt: string) {
  return prompt
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");
}
