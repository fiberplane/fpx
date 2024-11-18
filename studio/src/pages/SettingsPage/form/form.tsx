import { useToast } from "@/components/ui/use-toast";
import { useUpdateSettings } from "@/queries";
import { errorHasMessage } from "@/utils";
import { type Settings, SettingsSchema } from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const DEFAULT_VALUES = {
  aiProvider: "openai",
  aiProviderConfigurations: {
    openai: {
      model: "gpt-4o",
      apiKey: "",
    },
    anthropic: {
      model: "claude-3-5-sonnet-20240620",
      apiKey: "",
    },
    mistral: {
      model: "mistral-large-latest",
      apiKey: "",
    },
    ollama: {
      model: "llama3.1",
      apiKey: "",
    },
    fp: {
      model: "",
      apiKey: "",
    },
  },
  proxyRequestsEnabled: false,
  proxyBaseUrl: "https://webhonc.mies.workers.dev",
} satisfies Settings;

export function useSettingsForm(settings: Settings) {
  const { toast } = useToast();

  const { mutate: updateSettings } = useUpdateSettings();

  // TODO - Derive default values from the fiberplane types package
  const form = useForm<Settings>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...settings,
      aiProviderConfigurations: {
        ...DEFAULT_VALUES.aiProviderConfigurations,
        ...settings.aiProviderConfigurations,
      },
    },
  });

  function onSubmit(content: Settings) {
    updateSettings(
      { content },
      {
        onSuccess() {
          toast({ title: "Settings updated!" });
          // Reset the form state, so dirty fields are no longer dirty
          form.reset(content);
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
