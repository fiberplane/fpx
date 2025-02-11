import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { Link } from "react-router-dom";

export function EmptyState() {
  return (
    <div
      className={cn(
        "h-full",
        "flex flex-col items-center justify-center",
        "text-center",
        "px-4 py-8",
        "sm:px-6 sm:py-12",
        "md:px-8",
      )}
    >
      <h2 className="text-2xl font-semibold mb-4">Trace Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The trace you are looking for does not exist.
      </p>
      <Button asChild variant="ghost">
        <Link to="/requests">Go Back to Requests</Link>
      </Button>
    </div>
  );
}
