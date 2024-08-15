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
import { useSettingsForm } from "./form";

// TODO: automatically restart the fpx studio when this is changed
export function ProxyRequestsSettingsForm({
  settings,
}: { settings: Record<string, string> }) {
  const { form, onSubmit } = useSettingsForm(settings);
  const isProxyRequestsDirty = form.formState.dirtyFields.proxyRequestsEnabled;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Public URL Settings</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="proxyRequestsEnabled"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4", {
                    "border-yellow-100/50": isProxyRequestsDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        Enable Public URL
                        <span className="font-light text-gray-400 ml-2">
                          (Alpha)
                        </span>
                      </FormLabel>
                      <FormDescription className="max-w-3xl grid gap-2">
                        <p>
                          Enable proxying of requests from a remote service.
                          This feature is useful for debugging, testing, and
                          developing with services that are only available on a
                          public internet (like webhooks).
                        </p>
                        <p>
                          Any request received at this URL will be forwarded to
                          your app including all the request data (path,
                          headers, body, etc.).
                        </p>
                        <p>
                          E.g.: A request{" "}
                          <code className="font-mono text-wrap">
                            &lt;public_url&gt;/some-route{" "}
                          </code>
                          will be forwarded to your app:
                          <code className="font-mono text-wrap">
                            {" "}
                            &lt;your_app&gt;/some-route
                          </code>
                        </p>
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
                    <>
                      <FormField
                        control={form.control}
                        name="proxyBaseUrl"
                        render={({ field }) => (
                          <div className="flex flex-col gap-1">
                            <FormLabel className="block font-normal text-sm text-gray-300">
                              Base URL
                            </FormLabel>
                            <FormDescription className="mb-1">
                              You can configure the base URL used by the public
                              URL service.
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
                    </>
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
