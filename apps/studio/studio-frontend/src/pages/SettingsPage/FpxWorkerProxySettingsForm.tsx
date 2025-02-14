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
import { cn } from "@/utils";
import type { Settings } from "@fiberplane/fpx-types";
import { useSettingsForm } from "./form";

export function FpxWorkerProxySettingsForm({
  settings,
}: { settings: Settings }) {
  const { form, onSubmit } = useSettingsForm(settings);
  const isDirty =
    (form.formState.dirtyFields.fpxWorkerProxy?.enabled ||
      form.formState.dirtyFields.fpxWorkerProxy?.baseUrl ||
      form.formState.dirtyFields.fpxWorkerProxy?.bearerToken) ??
    false;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">
            Cloudflare Worker Proxy Settings
          </h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="fpxWorkerProxy.enabled"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4", {
                    "border-yellow-100/50": isDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        Cloudflare Worker Trace Ingestion
                        <span className="font-light text-gray-400 ml-2">
                          (Experimental)
                        </span>
                      </FormLabel>
                      <FormDescription className="max-w-3xl grid gap-2">
                        <div>
                          Enable reading trace data to from a remote ingestion
                          engine hosted on Cloudflare workers. Contact
                          Fiberplane for more information.
                        </div>
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="fpxWorkerProxy.baseUrl"
                      render={({ field }) => (
                        <div className="flex flex-col gap-1">
                          <FormLabel className="block font-normal text-sm text-gray-300">
                            Base URL
                          </FormLabel>
                          <FormDescription className="mb-1">
                            You can configure the base URL used by the
                            Cloudflare Worker Trace Ingestion service.
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder={field.value ?? ""}
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                  )}
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="fpxWorkerProxy.bearerToken"
                      render={({ field }) => (
                        <div className="flex flex-col gap-1">
                          <FormLabel className="block font-normal text-sm text-gray-300">
                            Bearer token
                          </FormLabel>
                          <FormDescription className="mb-1">
                            Configure the authorization token that will be used
                            in the Authorization header when making requests to
                            the Cloudflare Worker Trace Ingestion service.
                          </FormDescription>
                          <FormControl>
                            <Input
                              placeholder={field.value ?? ""}
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                  )}
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
