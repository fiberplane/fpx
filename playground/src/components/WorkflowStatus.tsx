import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type WorkflowStatusProps = {
  status: "completed" | "failed" | "pending";
};

type StatusConfig = {
  [K in WorkflowStatusProps["status"]]: {
    label: string;
    icon: typeof CheckCircle;
    variant: "success" | "destructive" | "default";
    className?: string;
  };
};

const statusConfig: StatusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle,
    variant: "success",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive",
  },
  pending: {
    label: "Running",
    icon: Clock,
    variant: "default",
    className: "bg-blue-100 hover:bg-blue-100/80 text-blue-700",
  },
};

export function WorkflowStatus({ status }: WorkflowStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </Badge>
  );
}
