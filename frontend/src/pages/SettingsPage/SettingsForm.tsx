import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useUpdateSettings } from "@/queries";
import { hasStringMessage } from "@/utils";

const FormSchema = z.object({
  ai_features: z.boolean(),
  openai_api_key: z.string().optional(),
});

export function SettingsForm({
  settings,
}: { settings: Record<string, string> }) {
  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ai_features: !!settings?.aiEnabled,
      openai_api_key: settings.openaiApiKey,
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    updateSettings(
      {
        content: {
          aiEnabled: data.ai_features,
          // Remove the stored api key if the feature is disabled
          openaiApiKey: data.ai_features ? data.openai_api_key : undefined,
        },
      },
      {
        onSuccess() {
          toast({
            title: "Settings updated!",
          });
        },
        onError(error) {
          toast({
            title: "Settings failed to update!",
            description: (
              <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
                <code className="text-red-400">
                  {hasStringMessage(error) ? error.message : "Unknown error"}
                </code>
              </pre>
            ),
          });
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Features</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="ai_features"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">AI Sprinkles</FormLabel>
                      <FormDescription>
                        Use AI to help generate sample request data and analyze
                        errors.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>

                  {field.value ? (
                    <FormField
                      control={form.control}
                      name="openai_api_key"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-between rounded-lg mt-1 text-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm text-gray-300">
                              OpenAI API Key
                            </FormLabel>
                            <FormDescription>
                              This is stored locally to make requests to the
                              OpenAI API
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ) : null}
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
