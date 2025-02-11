import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

export function Status({
  className,
  statusCode,
}: { className?: string; statusCode: number | undefined }) {
  if (!statusCode) {
    return null;
  }
  return (
    <Badge
      variant="secondary"
      className={clsx(
        "rounded",
        "font-normal",
        "px-1.5",
        {
          "bg-green-950/60 hover:bg-green-950/60 text-green-400":
            Math.floor(statusCode / 100) === 2,
        },
        {
          "bg-yellow-950/60 hover:bg-yellow-950/60 text-yellow-500":
            Math.floor(statusCode / 100) === 4,
        },
        {
          "bg-red-950/60 hover:bg-red-950/60 text-red-400":
            Math.floor(statusCode / 100) === 5,
        },
        className,
      )}
    >
      {statusCode ? statusCode : "NA"}
    </Badge>
  );
}
