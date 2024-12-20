import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { WorkflowStatusProps } from "@/lib/types";

export function WorkflowStatus({ status }: WorkflowStatusProps) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
  }
} 