import { cn } from "@/utils";

export function StatusCode({
  status,
  isFailure,
  className,
}: { status: string | number; isFailure: boolean; className?: string }) {
  const strStatus = status?.toString() ?? "-";
  const isSuccess = strStatus.startsWith("2");
  const isWarning = strStatus.startsWith("4");
  const isError = strStatus.startsWith("5");

  return (
    <span
      className={cn(
        "rounded-md",
        "px-2",
        "py-1",
        "text-xs",
        "font-mono",
        "font-medium",
        isSuccess && ["text-success", "bg-success/15"],
        isWarning && ["text-warning", "bg-warning/15"],
        (isError || isFailure) && [
          "text-danger",
          "bg-danger/15",
        ],
        className,
      )}
    >
      {isFailure ? "Fail" : strStatus}
    </span>
  );
}
