import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface WorkflowStatusProps {
  status: "completed" | "failed" | "pending";
}

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    variant: "success",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive",
  },
  pending: {
    label: "In Progress",
    icon: Clock,
    variant: "default",
  },
} as const;

export function WorkflowStatus({ status }: WorkflowStatusProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant as "success" | "destructive" | "default"}
      className={cn(
        "grid grid-cols-[auto_1fr] items-center gap-1",
        status === "pending" && "animate-pulse"
      )}
    >
      <config.icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
} 