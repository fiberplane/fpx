import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "success" | "pending" | "error" | undefined;
type Variant = "default" | "destructive" | "outline" | "secondary";

interface Props {
  status?: Status;
}

export function WorkflowStatus({ status = "pending" }: Props) {
  const variant: Variant = "outline";
  const className = status === "success"
    ? "bg-green-100 text-green-800 hover:bg-green-100/80"
    : status === "error"
    ? "bg-red-100 text-red-800 hover:bg-red-100/80"
    : "bg-blue-100 text-blue-800 hover:bg-blue-100/80";

  return (
    <Badge variant={variant} className={cn(className)}>
      {status ?? "pending"}
    </Badge>
  );
}
