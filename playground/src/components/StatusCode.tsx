import { cn } from "@/utils";

export function StatusCode({
  status,
  isFailure,
  className,
}: { status: string | number; isFailure: boolean; className?: string }) {
  const strStatus = status?.toString() ?? "-";
  const isGreen = strStatus.startsWith("2");
  const isOrange = strStatus.startsWith("4");
  const isRed = strStatus.startsWith("5");

  return (
    <span
      className={cn(
        "rounded-md",
        "px-2",
        "py-1",
        "text-xs",
        "bg-opacity-30",
        "font-sans",
        isGreen && ["text-green-400", "bg-green-800"],
        isOrange && ["text-orange-400", "bg-orange-800"],
        (isRed || isFailure) && ["text-red-400", "bg-red-800"],
        className,
      )}
    >
      {isFailure ? "Fail" : strStatus}
    </span>
  );
}
