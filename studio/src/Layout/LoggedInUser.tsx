import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserInfo } from "@/queries";
import { Link2Icon } from "@radix-ui/react-icons";

export function LoggedInUser() {
  const user = useUserInfo();
  if (!user) {
    return null;
  }
  return (
    <div className="text-xs text-blue-500 ml-2 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link2Icon className="w-3.5 h-3.5" />
        </TooltipTrigger>
        <TooltipContent className="border bg-background z-10 text-card-foreground/75">
          @{user.githubUsername}
          {user.aiRequestCredits ? (
            <>
              <span className="text-muted-foreground/80"> • </span>
              <span className="text-muted-foreground/80">
                {user.aiRequestCredits} AI Requests Remaining
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/80"> • </span>
              <span className="text-muted-foreground/80">
                No AI credits remaining &mdash; Credits refreshed daily
              </span>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
