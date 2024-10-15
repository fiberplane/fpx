import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";
import {
  type AiProviderType,
  AnthropicModelOptions,
  MistralModelOptions,
  OpenAIModelOptions,
  ProviderOptions,
  type Settings,
} from "@fiberplane/fpx-types";
import {
  CaretDownIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  SlashIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useSettingsForm } from "./form";

export function AISettingsForm({
  settings,
}: {
  settings: Settings;
}) {
  const { form, onSubmit } = useSettingsForm(settings);

  const isAiDirty =
    Object.keys(form.formState.dirtyFields).filter(
      (key) => !["proxyRequestsEnabled", "proxyBaseUrl"].includes(key),
    ).length > 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <div>
          <h3 className="hidden md:block md:mb-4 text-lg font-medium">
            Request Autofill Settings
          </h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="aiEnabled"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4 space-y-4", {
                    "border-yellow-100/50": isAiDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        Enable Request Autofill
                        <span className="font-light text-gray-400 ml-2">
                          (Beta)
                        </span>
                      </FormLabel>
                      <FormDescription>
                        Generate sample request data with AI.
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
                      name="aiProvider"
                      render={({ field: providerField }) => (
                        <div className="border-t pt-4">
                          <FormItem className="flex flex-col gap-2 justify-between rounded-lg text-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col gap-2">
                                <FormLabel className="text-base text-gray-300">
                                  Provider Configuration
                                </FormLabel>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <FormDescription className="mb-1">
                                Select the AI provider and model you want to
                                use.
                              </FormDescription>
                              <FormControl>
                                <div className="flex gap-2 items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="w-auto px-2 inline-flex items-center"
                                      >
                                        <CaretDownIcon className="h-3.5 w-3.5 mr-2 text-white" />
                                        {ProviderOptions[
                                          providerField.value as AiProviderType
                                        ] || "Select Provider"}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-full max-w-lg">
                                      <DropdownMenuRadioGroup
                                        value={providerField.value}
                                        onValueChange={(value) =>
                                          providerField.onChange(value)
                                        }
                                      >
                                        {Object.entries(ProviderOptions).map(
                                          ([option, label]) => (
                                            <DropdownMenuRadioItem
                                              key={option}
                                              value={option}
                                            >
                                              {label as React.ReactNode}
                                            </DropdownMenuRadioItem>
                                          ),
                                        )}
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <SlashIcon className="w-3.5 h-3.5" />
                                  <FormField
                                    control={form.control}
                                    name={
                                      `aiProviderConfigurations.${providerField.value as AiProviderType}.model` as const
                                    }
                                    render={({ field }) => (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-auto px-2 inline-flex items-center"
                                          >
                                            <CaretDownIcon className="h-3.5 w-3.5 mr-2 text-white" />
                                            {providerField.value === "openai"
                                              ? OpenAIModelOptions[
                                                  field.value as keyof typeof OpenAIModelOptions
                                                ] || "Select Model"
                                              : providerField.value ===
                                                  "anthropic"
                                                ? AnthropicModelOptions[
                                                    field.value as keyof typeof AnthropicModelOptions
                                                  ] || "Select Model"
                                                : providerField.value ===
                                                    "mistral"
                                                  ? MistralModelOptions[
                                                      field.value as keyof typeof MistralModelOptions
                                                    ] || "Select Model"
                                                  : "Select Model"}
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-full max-w-lg">
                                          <DropdownMenuRadioGroup
                                            value={field.value}
                                            onValueChange={(value) =>
                                              field.onChange(value)
                                            }
                                          >
                                            {Object.entries(
                                              providerField.value === "openai"
                                                ? OpenAIModelOptions
                                                : providerField.value ===
                                                    "anthropic"
                                                  ? AnthropicModelOptions
                                                  : providerField.value ===
                                                      "mistral"
                                                    ? MistralModelOptions
                                                    : {},
                                            ).map(([option, label]) => (
                                              <DropdownMenuRadioItem
                                                key={option}
                                                value={option}
                                              >
                                                {label as React.ReactNode}
                                              </DropdownMenuRadioItem>
                                            ))}
                                          </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  />
                                </div>
                              </FormControl>
                            </div>
                            <FormField
                              control={form.control}
                              name={
                                `aiProviderConfigurations.${providerField.value as AiProviderType}.apiKey` as const
                              }
                              render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                  <FormLabel className="block font-normal text-sm text-gray-300">
                                    API Key
                                  </FormLabel>
                                  <FormDescription className="mb-1">
                                    Your api key is stored locally in{" "}
                                    <code className="text-red-200/80 text-xs">
                                      .fpxconfig/fpx.db
                                    </code>{" "}
                                    to make requests to the{" "}
                                    {
                                      ProviderOptions[
                                        providerField.value as AiProviderType
                                      ]
                                    }{" "}
                                    API. It should be ignored by version control
                                    by default.
                                  </FormDescription>
                                  <FormControl>
                                    <ApiKeyInput
                                      value={field.value ?? ""}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={
                                `aiProviderConfigurations.${providerField.value as AiProviderType}.baseUrl` as const
                              }
                              render={({ field }) => (
                                <div className="flex flex-col gap-1">
                                  <FormLabel className="block font-normal text-sm text-gray-300">
                                    Base URL
                                  </FormLabel>
                                  <FormDescription className="mb-1">
                                    You can configure the base URL used by{" "}
                                    {
                                      ProviderOptions[
                                        providerField.value as AiProviderType
                                      ]
                                    }{" "}
                                    API client to use any compatible endpoint.
                                  </FormDescription>
                                  <FormControl>
                                    <Input
                                      value={field.value ?? ""}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                </div>
                              )}
                            />
                          </FormItem>
                          <div>
                            <CodeSentToAiBanner />
                          </div>
                        </div>
                      )}
                    />
                  ) : null}
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            className={cn("text-white", {
              "opacity-50": !isAiDirty,
            })}
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {isAiDirty ? "Update AI Settings" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const ApiKeyInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [passwordShown, setPasswordShown] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type={passwordShown ? "text" : "password"}
        className="w-full font-mono text-gray-300"
        value={value}
        onChange={onChange}
        autoComplete="off"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            onClick={togglePasswordVisibility}
          >
            {passwordShown ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-950 text-white" align="start">
          {passwordShown ? "Hide" : "Show"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

/**
 * Banner component to inform the end user their code is sent to an ai provider
 */
function CodeSentToAiBanner() {
  return (
    <div className="bg-primary/10 text-blue-300/90 text-sm px-2.5 py-4 mt-4 rounded-md grid grid-cols-[auto_1fr] gap-2.5 mb-2">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start gap-1.5">
        <span className="font-semibold">What FPX sends to AI providers</span>
        <div className="flex flex-col gap-1">
          <span className="">
            To generate inputs for HTTP requests, FPX sends the source code of
            route handlers along with short history of recent requests. Common
            sensitive headers are redacted by default.
          </span>
        </div>
      </div>
    </div>
  );
}
