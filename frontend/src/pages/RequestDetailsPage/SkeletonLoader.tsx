import { cn } from "@/utils";

export function SkeletonLoader() {
  return (
    <div
      className={cn(
        "h-full",
        "relative",
        "overflow-hidden",
        "overflow-y-auto",
        "grid grid-rows-[auto_1fr]",
        "px-2 pb-4",
        "sm:px-4 sm:pb-8",
        "md:px-6",
      )}
    >
      <div
        className={cn(
          "flex gap-4 items-center justify-between",
          "py-8",
          "sm:gap-6 sm:py-8",
        )}
      >
        <div className="h-8 w-48 bg-gray-800 animate-pulse rounded"></div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-800 animate-pulse rounded"></div>
          <div className="h-8 w-8 bg-gray-800 animate-pulse rounded"></div>
        </div>
      </div>
      <div className={cn("grid grid-rows-[auto_1fr] gap-4")}>
        <div className="h-6 w-32 bg-gray-800 animate-pulse rounded"></div>
        <div className="grid lg:grid-cols-[auto_1fr] lg:gap-2 xl:gap-3">
          <div
            className={cn(
              "hidden",
              "lg:block lg:sticky lg:top-4 self-start",
              "min-w-[300px]",
              "xl:min-w-[360px]",
              "2xl:min-w-[420px]",
            )}
          >
            <div className="h-64 bg-gray-800 animate-pulse rounded"></div>
          </div>
          <div
            className={cn(
              "grid items-center gap-4 overflow-x-auto relative",
              "max-lg:grid-rows-[auto_1fr]",
              "lg:items-start",
            )}
          >
            <div className="w-full lg:hidden">
              <div className="h-64 bg-gray-800 animate-pulse rounded"></div>
            </div>
            <div className="h-64 bg-gray-800 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
