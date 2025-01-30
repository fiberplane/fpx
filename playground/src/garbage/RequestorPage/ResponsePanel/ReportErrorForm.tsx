import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReport } from "@/lib/hooks/useReport";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  description: z.string().min(1, "Please provide a description"),
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  traceId: string;
  onSuccess?: () => void;
};

export function ReportErrorForm({ traceId, onSuccess }: Props) {
  const { mutate, isPending, isSuccess } = useCreateReport();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = (values: FormSchema) => {
    mutate(
      { traceId, description: values.description },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  if (isSuccess) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="rounded-full bg-success/15 p-3 w-fit mx-auto">
          <Icon icon="lucide:check-circle" className="w-6 h-6 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Issue Reported</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback. The API developers have been notified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe what went wrong..."
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Report"}
        </Button>
      </form>
    </Form>
  );
}
