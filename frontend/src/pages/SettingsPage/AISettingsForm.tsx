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
  CaretDownIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useSettingsForm } from "./form";

export function AISettingsForm({
  settings,
}: { settings: Record<string, string> }) {
  const { form, onSubmit } = useSettingsForm(settings);

  const isAiDirty =
    form.formState.dirtyFields.ai_features ||
    form.formState.dirtyFields.openai_api_key ||
    form.formState.dirtyFields.openai_model;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <div>
          <h3 className="hidden md:block md:mb-4 text-lg font-medium">
            AI Settings
          </h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="ai_features"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4 space-y-4", {
                    "border-yellow-100/50": isAiDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        AI Sprinkles
                        <span className="font-light text-gray-400 ml-2">
                          (Beta)
                        </span>
                      </FormLabel>
                      <FormDescription>
                        Generate sample request data with AI. Requires an OpenAI
                        API key.
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
                        <div className="border-t pt-4">
                          <FormItem className="flex flex-col gap-2 justify-between rounded-lg text-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col gap-2">
                                <FormLabel className="text-base text-gray-300">
                                  OpenAI Conifguration
                                </FormLabel>
                                <AnthropicSupportCallout />
                              </div>
                              <div className="flex flex-col gap-1">
                                <FormLabel className="block font-normal text-sm text-gray-300">
                                  API Key
                                </FormLabel>
                                <FormDescription className="mb-1">
                                  Your api key is stored locally in{" "}
                                  <code className="text-red-200/80 text-xs">
                                    .fpxconfig/fpx.db
                                  </code>{" "}
                                  to make requests to the OpenAI API. It should
                                  be ignored by version control by default.
                                </FormDescription>
                                <FormControl>
                                  <ApiKeyInput
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                              </div>
                            </div>
                            <FormField
                              control={form.control}
                              name="openai_model"
                              render={({ field }) => (
                                <FormItem className="flex flex-col justify-between rounded-lg text-sm">
                                  <FormLabel className="text-sm text-gray-300 font-normal">
                                    Model
                                  </FormLabel>
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
                                            {field.value ?? "gpt-4o"}
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-full max-w-lg">
                                          <DropdownMenuRadioGroup
                                            value={field.value}
                                            onValueChange={(value) =>
                                              field.onChange(value)
                                            }
                                          >
                                            <DropdownMenuRadioItem value="gpt-4o">
                                              gpt-4o
                                            </DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="gpt-3.5">
                                              gpt-3.5
                                            </DropdownMenuRadioItem>
                                          </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      <FormDescription>
                                        Select the OpenAI model you want to use
                                      </FormDescription>
                                    </div>
                                  </FormControl>
                                </FormItem>
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
            className="text-white"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            Save
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
        className="w-full max-w-lg"
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

function AnthropicSupportCallout() {
  return (
    <div className="w-full pt-1 pb-2">
      <div className="flex items-center gap-2 text-gray-500">
        <InfoCircledIcon className="h-3.5 w-3.5" />
        <span className="text-xs  italic">
          Support for Anthropic coming soon!
        </span>
      </div>
    </div>
  );
}

/**
 * Banner component to inform the end user their code is sent to an ai provider
 */
function CodeSentToAiBanner() {
  return (
    <div className="bg-primary/20 text-blue-300 text-sm px-2.5 py-4 mt-4 rounded-md grid grid-cols-[auto_1fr] gap-2.5 mb-2">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start gap-1.5">
        <span className="font-semibold">What FPX sends to OpenAI</span>
        <div className="flex flex-col gap-1">
          <span className="">
            To generate inputs for HTTP requests, FPX sends the source code of
            route handlers to OpenAI.
          </span>
          <span>
            FPX also sends a short history of recent requests. Common sensitive
            headers are redacted by default.
          </span>
        </div>
      </div>
    </div>
  );
}
