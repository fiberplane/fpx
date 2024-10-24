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
import { FP_SERVICES_LOGIN_URL } from "@/constants";
import { type UserInfo, useUserInfo } from "@/queries";
import { cn } from "@/utils";
import {
  type AiProviderType,
  AnthropicModelOptions,
  MistralModelOptions,
  OllamaModelOptions,
  OpenAIModelOptions,
  ProviderOptions,
  type Settings,
} from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import {
  CaretDownIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { ProfileItem } from "./Profile";
import { useSettingsForm } from "./form";

const getAnthropicModelReleaseDate = (model: string) => {
  const chunks = model.split("-");
  return chunks[chunks.length - 1];
};

function useModelOptions(provider: AiProviderType) {
  return useMemo(() => {
    const modelOptions = Object.entries(
      provider === "openai"
        ? OpenAIModelOptions
        : provider === "anthropic"
          ? AnthropicModelOptions
          : provider === "mistral"
            ? MistralModelOptions
            : provider === "ollama"
              ? OllamaModelOptions
              : {},
    );

    // HACK - Anthropic models end in their date of release, so we sort by release date descending
    //        This makes sure sonnet-3.5 is at the top of the list
    if (provider === "anthropic") {
      modelOptions.sort((a, b) => {
        const modelNameA = a[0];
        const modelNameB = b[0];
        const dateStringA = getAnthropicModelReleaseDate(modelNameA);
        const dateStringB = getAnthropicModelReleaseDate(modelNameB);
        return dateStringB.localeCompare(dateStringA);
      });
    }

    // Sort mistral models by the "latest" keyword
    if (provider === "mistral") {
      modelOptions.sort((a, b) => {
        const modelNameA = a[0];
        const modelNameB = b[0];
        if (modelNameA.includes("latest")) {
          return -1;
        }
        if (modelNameB.includes("latest")) {
          return 1;
        }
        return modelNameA.localeCompare(modelNameB);
      });
    }

    // Sort gpt-4o to the top of the list
    if (provider === "openai") {
      modelOptions.sort((a, b) => {
        const modelNameA = a[0];
        const modelNameB = b[0];
        if (modelNameA.includes("gpt-4o")) {
          return -1;
        }
        if (modelNameB.includes("gpt-4o")) {
          return 1;
        }
        return modelNameA.localeCompare(modelNameB);
      });
    }

    return modelOptions;
  }, [provider]);
}

export function AISettingsForm({
  settings,
}: {
  settings: Settings;
}) {
  const user = useUserInfo();
  const { form, onSubmit } = useSettingsForm(settings);

  const isAiDirty =
    Object.keys(form.formState.dirtyFields).filter(
      (key) => !["proxyRequestsEnabled", "proxyBaseUrl"].includes(key),
    ).length > 0;

  const sortedProviderOptions = useMemo(() => {
    const options = Object.entries(ProviderOptions);
    options.sort((a, b) => a[0].localeCompare(b[0]));
    return options;
  }, []);

  const selectedProvider = form.watch("aiProvider");

  const activeProvider = Object.keys(ProviderOptions).find(
    (provider) => provider === selectedProvider,
  ) as AiProviderType;

  const shouldShowBannerAndSave = !(!user && activeProvider === "fp");

  const modelOptions = useModelOptions(activeProvider);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (data) => {
            onSubmit(data);
          },
          (error) => {
            // TODO - Show error to user
            //        This can show up with the new settings form in a bad way
            console.error("Form submission error:", error);
          },
        )}
        className="w-full space-y-4 pb-8"
      >
        <div>
          <h3 className="md:block md:mb-4 text-lg font-medium">
            Request Autofill Settings
          </h3>
          <div className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="aiProvider"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <FormLabel>AI Provider</FormLabel>
                    <FormDescription>
                      Select the AI provider for request autofill.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-1"
                    >
                      {sortedProviderOptions.map(([option, label]) => (
                        <FormItem
                          key={option}
                          className="grid grid-cols-[auto_1fr] items-center gap-4 py-1 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={option} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {label as React.ReactNode}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            {sortedProviderOptions.map(([provider]) => (
              <div
                key={provider}
                className={cn("space-y-4", {
                  hidden: provider !== activeProvider,
                })}
              >
                <h4 className="hidden text-md font-medium">
                  {ProviderOptions[provider as AiProviderType]}
                </h4>
                {provider !== "fp" && (
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
                                {modelOptions.map(([option, label]) => (
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
                )}
                {provider !== "ollama" && provider !== "fp" && (
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
                            // HACK - Prevent clipping of focus ring
                            className="mx-[2px]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
                {provider !== "fp" && (
                  <FormField
                    control={form.control}
                    name={
                      `aiProviderConfigurations.${provider as AiProviderType}.baseUrl` as const
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Base URL{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder={`Enter ${ProviderOptions[provider as AiProviderType]} Base URL`}
                            // HACK - Match API Key input styles and prevent clipping of focus ring
                            className="w-[calc(100%-4px)] font-mono mx-[2px]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {activeProvider === "fp" && <FiberplaneSection user={user} />}
        {shouldShowBannerAndSave && (
          <>
            <CodeSentToAiBanner />
            <div className="text-right">
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
          </>
        )}
      </form>
    </Form>
  );
}

const ApiKeyInput = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
}) => {
  const [passwordShown, setPasswordShown] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordShown(!passwordShown);
  };

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2">
      <Input
        type={passwordShown ? "text" : "password"}
        className={cn("w-full font-mono text-gray-300", className)}
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
      <div className="grid gap-1.5">
        <span className="font-semibold">What FPX sends to AI providers</span>
        <div className="grid gap-1">
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

function FiberplaneSection({ user }: { user?: UserInfo | null }) {
  if (user) {
    return (
      <>
        <ProfileItem
          icon="lucide:zap"
          label="AI Requests"
          value={
            user.aiRequestCredits !== undefined
              ? `${user.aiRequestCredits} requests remaining`
              : "N/A"
          }
        />
      </>
    );
  }
  return (
    <div className="w-full text-sm py-4 mt-4 rounded-md gap-2.5 mb-2">
      <div className="grid gap-1.5">
        <span className="font-semibold">Connect to Fiberplane</span>
        <div className="grid gap-1">
          <span className="text-muted-foreground">
            Log in with GitHub to get up and running with 50 free AI generated
            requests per day.
          </span>
        </div>
        <Button
          className="mt-2 bg-transparent text-white w-full py-2 rounded-md border border-slate-800"
          variant="link"
          asChild
        >
          <a
            href={FP_SERVICES_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon icon="lucide:github" className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </a>
        </Button>
      </div>
    </div>
  );
}
