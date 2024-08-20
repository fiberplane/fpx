import { useToast } from "@/components/ui/use-toast";
import { useUpdateSettings } from "@/queries";
import { errorHasMessage } from "@/utils";
import {
  CLAUDE_3_5_SONNET,
  GPT_4o,
  Settings,
  SettingsSchema,
} from "@fiberplane/fpx-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const DEFAULT_VALUES = {
  aiEnabled: false,
  aiProviderType: "openai",
  openaiModel: GPT_4o,
  anthropicModel: CLAUDE_3_5_SONNET,
  customRoutesEnabled: false,
  proxyRequestsEnabled: false,
  proxyBaseUrl: "https://webhonc.mies.workers.dev",
} satisfies Settings;

export function useSettingsForm(settings: Settings) {
  const { toast } = useToast();

  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<Settings>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      ...DEFAULT_VALUES,
      ...settings,
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
