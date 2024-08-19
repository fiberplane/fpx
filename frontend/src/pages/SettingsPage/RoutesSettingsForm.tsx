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
import { SettingsForm } from "@fiberplane/fpx-types";
import { useSettingsForm } from "./form";

export function RoutesSettingsForm({
  settings,
}: { settings: SettingsForm }) {
  const { form, onSubmit } = useSettingsForm(settings);
  const isCustomRoutesDirty = form.formState.dirtyFields.customRoutesEnabled;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Custom Routes Settings</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customRoutesEnabled"
              render={({ field }) => (
                <FormItem
                  className={cn("rounded-lg border p-4", {
                    "border-yellow-100/50": isCustomRoutesDirty,
                  })}
                >
                  <div className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        Enable Custom Routes
                        <span className="font-light text-gray-400 ml-2">
                          (Alpha)
                        </span>
                      </FormLabel>
                      <FormDescription>
                        Make requests against routes that are not detected from
                        your application code.
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
