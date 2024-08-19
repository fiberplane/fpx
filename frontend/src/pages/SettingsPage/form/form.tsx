import { useToast } from "@/components/ui/use-toast";
import { useUpdateSettings } from "@/queries";
import { errorHasMessage } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CLAUDE_3_5_SONNET, FormSchema, GPT_4o } from "./types";
import { Settings } from "@fiberplane/fpx-types";

const DEFAULT_VALUES = {
  aiEnabled: { value: false },
  aiProviderType: { value: "openai" },
  openaiModel: { value: GPT_4o },
  anthropicModel: { value: CLAUDE_3_5_SONNET },
  customRoutesEnabled: { value: false },
  proxyRequestsEnabled: { value: false },
  proxyBaseUrl: { value: "https://webhonc.mies.workers.dev" },
} satisfies Settings;

export function useSettingsForm(settings: Settings) {
  const { toast } = useToast();

  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<Settings>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...settings,
    },
  });

  function onSubmit(data: Settings) {
    updateSettings(
      {
        content: {
          ...data,

          // customRoutesEnabled: data.customRoutesEnabled,
          // aiEnabled: data.aiEnabled,
          // aiProviderType: data.aiProviderType,
          // // Remove the stored api key if the feature is disabled
          // ...(data.aiEnabled
          //   ? {
          //     openaiApiKey: data.openaiApiKey,
          //     anthropicApiKey: data.anthropicApiKey,
          //   }
          //   : {}),
          // openaiBaseUrl: data.openaiBaseUrl ?? "",
          // openaiModel: data.openaiModel,
          // anthropicBaseUrl: data.anthropicBaseUrl ?? "",
          // anthropicModel: data.anthropicModel,
          // proxyRequestsEnabled: data.proxyRequestsEnabled,
          // proxyBaseUrl: data.proxyBaseUrl,
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
