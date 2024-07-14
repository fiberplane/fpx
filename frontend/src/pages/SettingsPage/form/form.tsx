import { useToast } from "@/components/ui/use-toast";
import { useUpdateSettings } from "@/queries";
import { errorHasMessage } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormSchema, isValidOpenaiModel } from "./types";

const DEFAULT_OPENAI_MODEL = "gpt-4o";

export function useSettingsForm(settings: Record<string, string>) {
  const { toast } = useToast();

  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ai_features: !!settings?.aiEnabled,
      openai_api_key: settings.openaiApiKey ?? "",
      custom_routes: !!settings?.customRoutesEnabled,
      openai_model: isValidOpenaiModel(settings.openaiModel)
        ? settings.openaiModel
        : DEFAULT_OPENAI_MODEL,
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    updateSettings(
      {
        content: {
          aiEnabled: data.ai_features,
          // Remove the stored api key if the feature is disabled
          openaiApiKey: data.ai_features ? data.openai_api_key : undefined,
          openaiModel: data.openai_model,
          customRoutesEnabled: data.custom_routes,
        },
      },
      {
        onSuccess() {
          toast({ title: "Settings updated!" });
          // Reset the form state, so dirty fields are no longer dirty
          form.reset(data);
        },
        onError(error) {
          toast({
            title: "Settings failed to update!",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-red-400">
                  {errorHasMessage(error) ? error.message : "Unknown error"}
                </code>
              </pre>
            ),
          });
        },
      },
    );
  }

  return {
    onSubmit,
    form,
  };
}
