import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils";
import { useSettingsForm } from "./form";
import { Card, CardContent } from "@/components/ui/card";

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
          <h3 className="mb-4 text-lg font-medium">Proxy Requests Settings</h3>
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
                        Enable Proxy Requests
                        <span className="font-light text-gray-400 ml-2">
                          (Alpha)
                        </span>
                      </FormLabel>
                      <FormDescription className="max-w-3xl">
                        Enable proxying of requests from a remote service. This feature
                        is useful for debugging, testing, and developing with services
                        that are only available on a public internet (like webhooks).
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
                    <Card className="bg-muted/20 rounded-xl">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-bold">Note</span>: You will need to restart the FPX studio for this change to take effect.
                        </p>
                      </CardContent>
                    </Card>
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
