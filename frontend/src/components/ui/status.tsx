import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

export function Status({
  className,
  statusCode,
}: { className?: string; statusCode: number }) {
  return (
    <Badge
      variant="secondary"
      className={clsx(
        "rounded",
        {
          "bg-green-950 hover:bg-green-950 text-green-300":
            statusCode / 100 === 2,
        },
        {
          "bg-yellow-950 hover:bg-yellow-950 text-yellow-300":
            statusCode / 100 === 4,
        },
        {
          "bg-red-950 hover:bg-red-950 text-red-300": statusCode / 100 === 5,
        },
        className,
      )}
    >
      {statusCode}
    </Badge>
  );
}
