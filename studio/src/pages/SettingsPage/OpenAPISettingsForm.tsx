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
import type { Settings } from "@fiberplane/fpx-types";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { useSettingsForm } from "./form";

type OpenAPISettingsFormProps = {
  settings: Settings;
};

export function OpenAPISettingsForm({ settings }: OpenAPISettingsFormProps) {
  const { form, onSubmit } = useSettingsForm(settings);

  const isFormDirty = Object.keys(form.formState.dirtyFields).length > 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (data) => {
            onSubmit(data);
          },
          (error) => {
            console.error("Form submission error:", error);
          },
        )}
        className="w-full space-y-4 pb-8 px-0.5"
      >
        <div>
          <h3 className="md:block md:mb-4 text-lg font-medium">
            OpenAPI Settings
          </h3>
          <div className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="openApiSpecUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col gap-2">
                    <FormLabel>OpenAPI Specification URL</FormLabel>
                    <FormDescription>
                      Enter the URL of your OpenAPI specification file (JSON or
                      YAML format).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/openapi.json"
                      {...field}
                      value={field.value || ""}
                      className="font-mono"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-primary/10 text-blue-300/90 text-sm px-2.5 py-4 mt-4 rounded-md grid grid-cols-[auto_1fr] gap-2.5 mb-2">
          <div className="py-0.5">
            <InfoCircledIcon className="w-3.5 h-3.5" />
          </div>
          <div className="grid gap-1.5">
            <span className="font-semibold">About OpenAPI Integration</span>
            <div className="grid gap-1">
              <span>
                The OpenAPI specification will be used to enhance request
                validation and provide better suggestions for request
                parameters.
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <Button
            className="text-white opacity-100 disabled:opacity-50"
            type="submit"
            disabled={!isFormDirty || form.formState.isSubmitting}
          >
            {isFormDirty ? "Update OpenAPI Settings" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
