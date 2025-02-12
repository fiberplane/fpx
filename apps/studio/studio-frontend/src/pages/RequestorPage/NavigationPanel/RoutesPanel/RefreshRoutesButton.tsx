import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useRefreshRoutes } from "./useRefreshRoutes";

export function RefreshRoutesButton() {
  const { refreshRoutes, isRefreshing } = useRefreshRoutes();

  return (
    <Button
      onClick={() => refreshRoutes()}
      disabled={isRefreshing}
      className={cn("bg-transparent text-muted-foreground")}
      variant="outline"
      size="sm"
    >
      <ReloadIcon
        className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
      />
      {isRefreshing ? "Checking..." : "Try Again"}
    </Button>
  );
}
