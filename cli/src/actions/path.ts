import type { Context } from "@/context";
import { text } from "@clack/prompts";

// TODO: validate path
export async function promptPath(ctx: Context) {
  try {
    const placeholder = "./spooking-honc";
    const result = await text({
      message: "Where should we create your project? (./relative-path)",
      placeholder,
      defaultValue: placeholder,
      validate: (value) => {
        if (value !== "" && value[0] !== ".") {
          return "Please enter a relative path.";
        }
      },
    });

    if (typeof result === "string") {
      if (result === "") ctx.path = placeholder;
      else ctx.path = result;
    }

    return result;
  } catch (error) {
    return error;
  }
}
