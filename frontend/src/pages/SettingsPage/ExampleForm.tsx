import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useUpdateSettings } from "./queries"

const FormSchema = z.object({
  ai_features: z.boolean(),
})


export function SwitchForm({ settings }: { settings: Record<string, string> }) {
  const { mutate: updateSettings } = useUpdateSettings();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      ai_features: !!settings?.aiEnabled,
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    updateSettings({
      content: {
        aiEnabled: data.ai_features
      }
    }, {
      onSuccess() {
        toast({
          title: "Settings updated!",
        })
      },
      onError(error) {
        toast({
          title: "Settings failed to update!",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-red-400">{hasStringMessage(error) ? error.message : "Unknown error"}</code>
            </pre>
          ),
        })
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Features</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="ai_features"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      AI Features
                    </FormLabel>
                    <FormDescription>
                      Use AI to help generate sample request data and analyze errors.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="security_emails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Security emails</FormLabel>
                    <FormDescription>
                      Receive emails about your account security.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled
                      aria-readonly
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}
          </div>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

function hasStringMessage(error: unknown): error is { message: string } {
  if (!error) {
    return false;
  }
  return typeof error === "object" && "message" in error && typeof error.message === "string" && error.message !== "";
}
