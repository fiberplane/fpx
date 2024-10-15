import type { Context } from "@/context";
import { text } from "@clack/prompts";

export async function promptDescription(ctx: Context) {
  try {
    const placeholder = 'E.g., "A social network for geese"';
    const result = await text({
      message: "Briefly describe what you want to build.",
      placeholder,
      defaultValue: "",
    });

    // NOTE - Do not give a default description
    if (typeof result === "string") {
      if (result !== "") {
        ctx.description = result;
      }
    }

    return result;
  } catch (error) {
    return error;
  }
}
