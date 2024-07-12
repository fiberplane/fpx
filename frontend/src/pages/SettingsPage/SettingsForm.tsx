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
import { cn, errorHasMessage } from "@/utils";
import { useState } from "react";
import { EyeOpenIcon, EyeClosedIcon, CaretDownIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const OpenAiModelSchema = z.union([z.literal('gpt-4o'), z.literal('gpt-3.5')]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

const isValidOpenaiModel = (value: string): value is OpenAiModel => OpenAiModelSchema.safeParse(value).success;

const FormSchema = z.object({
  ai_features: z.boolean(),
  openai_api_key: z.string().optional(),
  custom_routes: z.boolean(),
  openai_model: OpenAiModelSchema,
});

export function SettingsForm({
  settings,
}: { settings: Record<string, string> }) {
  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ai_features: !!settings?.aiEnabled,
      openai_api_key: settings.openaiApiKey ?? "",
      custom_routes: !!settings?.customRoutesEnabled,
      openai_model: isValidOpenaiModel(settings.openaiModel) ? settings.openaiModel : 'gpt-4o',
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
                  {errorHasMessage(error) ? error.message : "Unknown error"}
                </code>
              </pre>
            ),
          });
        },
      },
    );
  }

  const isAiDirty = form.formState.dirtyFields.ai_features || form.formState.dirtyFields.openai_api_key || form.formState.dirtyFields.openaiModel;
  const isCustomRoutesDirty = form.formState.dirtyFields.custom_routes;

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
                <FormItem className={cn("rounded-lg border p-4", { "border-yellow-100/50": isAiDirty })}>
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="space-y-1">
                      <FormLabel className="text-base">AI Sprinkles</FormLabel>
                      <FormDescription>
                        Use AI to help generate sample request data.
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
                        <>
                          <FormItem className="flex flex-col justify-between rounded-lg mt-1 text-sm">
                            <div className="space-y-1">
                              <FormLabel className="text-sm text-gray-300">
                                OpenAI API Key
                              </FormLabel>
                              <FormDescription>
                                This is stored locally to make requests to the
                                OpenAI API
                              </FormDescription>
                            </div>
                            <FormControl>
                              <PasswordInput
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                          <FormField
                            control={form.control}
                            name="openai_model"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-between rounded-lg mt-1 text-sm">
                                <div className="space-y-1">
                                  <FormLabel className="text-sm text-gray-300">
                                    OpenAI Model
                                  </FormLabel>
                                  <FormDescription>
                                    Select the model to use for AI features.
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" className="w-auto inline-flex items-center">
                                          <CaretDownIcon className="h-4 w-4 mr-2 text-white" />
                                          {field.value ?? 'gpt-4o'}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-full max-w-lg">
                                        <DropdownMenuItem onSelect={() => field.onChange('gpt-4o')}>
                                          gpt-4o
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => field.onChange('gpt-3.5')}>
                                          gpt-3.5
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          ></FormField>
                         
                          <FormLabel className="text-sm text-gray-300 italic">
                            <div className="pt-4 pb-1 font-light w-full">
                              *Support for Anthropic coming soon!*
                            </div>
                          </FormLabel>
                        </>
                      )}
                    />
                  ) : null}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="custom_routes"
              render={({ field }) => (
                <FormItem className={cn("rounded-lg border p-4", { "border-yellow-100/50": isCustomRoutesDirty })}>
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base">Custom Routes (Alpha)</FormLabel>
                      <FormDescription>
                        Make requests against routes that are not detected from your application code.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="text-white" type="submit" disabled={form.formState.isSubmitting}>Save</Button>
        </div>
      </form>
    </Form>
  );
}


const PasswordInput = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const [passwordShown, setPasswordShown] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type={passwordShown ? 'text' : 'password'}
        className="w-full max-w-lg"
        value={value}
        onChange={onChange}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" onClick={togglePasswordVisibility}>
            {passwordShown ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-950 text-white" align="start">
          {passwordShown ? 'Hide' : 'Show'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};