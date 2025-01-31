import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { ProxiedRequestResponse } from "../queries";
import { useServiceBaseUrl } from "../store";
import type { RequestorActiveResponse } from "../store/types";
import { ResponseSummary } from "./ResponseSummary";

const formSchema = z.object({
  description: z.string().min(1, "Please provide your feedback"),
});

type FormSchema = z.infer<typeof formSchema>;

type Props = {
  traceId: string;
  onSuccess?: () => void;
  isError?: boolean;
  response?: ProxiedRequestResponse | RequestorActiveResponse;
};

export function FeedbackForm({ traceId, onSuccess, isError, response }: Props) {
  const { mutate, isPending, isSuccess } = useCreateReport();

  const { removeServiceUrlFromPath } = useServiceBaseUrl();

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
          <h3 className="font-medium">Feedback Received</h3>
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback. The API team will review your message.
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
              <FormLabel>
                {isError ? "What went wrong?" : "Your feedback"}
              </FormLabel>
              <FormDescription className="text-xs pb-1">
                Your feedback will be shared with the API developers along with
                details of the request you just made
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={
                    isError
                      ? "Please describe what went wrong..."
                      : "Questions, suggestions, or issues..."
                  }
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
        <div className="">
          {response && (
            <div className="mt-4 mb-4 space-y-2">
              <FormLabel className="flex items-center text-muted-foreground mt-1 font-normal">
                <Icon
                  icon="lucide:link"
                  className="w-4 h-4 inline-block mr-1"
                />
                <span className="italic">Attaching this request</span>
              </FormLabel>
              <div className="rounded border bg-muted/40 mb-2 p-2 opacity-70 hover:opacity-100">
                <ResponseSummary
                  response={response}
                  transformUrl={removeServiceUrlFromPath}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
