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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
              name="aiProvider"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>AI Provider</FormLabel>
                  <FormDescription>
                    Select the AI provider for request autofill.
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {Object.entries(ProviderOptions).map(
                        ([option, label]) => (
                          <FormItem
                            key={option}
                            className="flex items-center space-x-3 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={option} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {label as React.ReactNode}
                            </FormLabel>
                          </FormItem>
                        ),
                      )}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            {Object.keys(ProviderOptions).map((provider) => (
              <div key={provider} className="space-y-4">
                <h4 className="text-md font-medium">
                  {ProviderOptions[provider as AiProviderType]}
                </h4>
                <FormField
                  control={form.control}
                  name={
                    `aiProviderConfigurations.${provider as AiProviderType}.model` as const
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pr-2">Model</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              {field.value || "Select Model"}
                              <CaretDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuRadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              {Object.entries(
                                provider === "openai"
                                  ? OpenAIModelOptions
                                  : provider === "anthropic"
                                    ? AnthropicModelOptions
                                    : provider === "mistral"
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
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={
                    `aiProviderConfigurations.${provider as AiProviderType}.apiKey` as const
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <ApiKeyInput
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={`Enter ${ProviderOptions[provider as AiProviderType]} API Key`}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={
                    `aiProviderConfigurations.${provider as AiProviderType}.baseUrl` as const
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base URL</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={`Enter ${ProviderOptions[provider as AiProviderType]} Base URL`}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </div>
        <CodeSentToAiBanner />
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
  placeholder,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
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
        placeholder={placeholder}
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
