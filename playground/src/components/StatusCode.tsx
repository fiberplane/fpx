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
        isSuccess && ["text-[--fp-status-success-fg]", "bg-[--fp-status-success]"],
        isWarning && ["text-[--fp-status-warning-fg]", "bg-[--fp-status-warning]"],
        (isError || isFailure) && ["text-[--fp-status-error-fg]", "bg-[--fp-status-error]"],
        className,
      )}
    >
      {isFailure ? "Fail" : strStatus}
    </span>
  );
}
