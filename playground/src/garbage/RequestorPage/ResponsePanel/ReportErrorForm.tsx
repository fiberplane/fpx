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
  const { mutate, isPending } = useCreateReport();

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
          form.reset();
        },
      },
    );
  };

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
