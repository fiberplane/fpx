import type { Context } from "@/context";
import { text } from "@clack/prompts";

// TODO: validate path
export async function promptDescription(ctx: Context) {
  try {
    const placeholder = "a json data api with Hono.js";
    const result = await text({
      message: "What kind of app are you building?",
      placeholder,
      defaultValue: placeholder,
    });

    if (typeof result === "string") {
      if (result === "") {
        ctx.description = placeholder;
      } else {
        ctx.description = result;
      }
    }

    return result;
  } catch (error) {
    return error;
  }
}
