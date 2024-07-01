import { cn } from "@/utils";
import { getHttpMethodTextColor } from "../RequestorPage/method";

export function RequestMethod({
  method,
  className,
}: { method: string; className?: string }) {
  return (
    <span className={cn("text-sm", getHttpMethodTextColor(method), className)}>
      {method}
    </span>
  );
}
