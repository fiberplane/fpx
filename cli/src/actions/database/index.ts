import type { Context } from "@/context";
import { confirm } from "@clack/prompts";
import { showNeonSetupInstructions, runNeonSetup } from "./neon";
import { showSupabaseSetupInstructions } from "./supabase";
import { showD1SetupInstructions } from "./d1";

export async function promptDatabase(ctx: Context) {
  switch (ctx.template) {
    case "base-supa": {
      ctx.database = "supabase";
      break;
    }
    case "sample-d1":{
      ctx.database ="d1";
      break;
    }
    case "base": {
      ctx.database = "neon";
      const confirmNeonSetup = await confirm({
        message:
          "The selected template uses Neon, do you want the create-honc-app to set up the connection string for you?",
        initialValue: true,
      });

      if (typeof confirmNeonSetup === "boolean" && confirmNeonSetup) {
        ctx.flags.push("setup-neon");
      }

      // we're returning here so that in case the value isCancel we can handle it
      return confirmNeonSetup;
    }
  }

  return;
}

export async function actionDatabase(ctx: Context) {
  if (ctx.database === "supabase") {
    showSupabaseSetupInstructions();
    return;
  }
  if(ctx.database === "d1"){
    showD1SetupInstructions();
    return;
  }

  if (ctx.database === "neon") {
    if (ctx.flags.includes("setup-neon")) {
      const result = await runNeonSetup(ctx);
      return result;
    }

    showNeonSetupInstructions();

    return;
  }

  return;
}
