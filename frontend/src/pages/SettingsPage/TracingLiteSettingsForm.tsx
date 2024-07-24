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

export function TracingLiteSettingsForm({
  settings,
}: { settings: Record<string, string> }) {
  const { form, onSubmit } = useSettingsForm(settings);
  const isTracingLiteDirty = form.formState.dirtyFields.tracingLiteEnabled;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Tracing Lite Settings</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="tracingLiteEnabled"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4", {
                    "border-yellow-100/50": isTracingLiteDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        Enable Tracing Lite
                        <span className="font-light text-gray-400 ml-2">
                          (Alpha)
                        </span>
                      </FormLabel>
                      <FormDescription>
                        On the request details page, show a timeline view of the
                        incoming request, fetches, and logs that occurred.
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
