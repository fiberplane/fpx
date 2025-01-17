import { cn, getHttpMethodTextColor } from "@/utils";

export function Method({
  method,
  className,
}: { method: string; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono",
        "pt-0.5", // HACK - to adjust baseline of mono font to look good next to sans
        getHttpMethodTextColor(method?.toUpperCase?.()),
        className,
      )}
    >
      {method}
    </span>
  );
}
