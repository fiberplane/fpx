import { cn, getHttpMethodTextColor } from "@/utils";

export function RequestMethod({
  method,
  className,
}: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-sm uppercase",
        getHttpMethodTextColor(method),
        className,
      )}
    >
      {method}
    </span>
  );
}
