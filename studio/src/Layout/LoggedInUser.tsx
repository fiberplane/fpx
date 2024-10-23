import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserInfo } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";

export function LoggedInUser() {
  const user = useUserInfo();
  if (!user) {
    return (
      <div className="text-xs flex items-center border-l pl-2">
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground py-0.5 px-0.5"
        >
          Log in
        </Button>
      </div>
    );
  }
  return (
    <div className="text-xs flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="p-0.5 h-6 w-6">
            <Icon icon="lucide:circle-user" className={cn("w-3.5 h-3.5")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="border bg-background z-10 text-card-foreground/75">
          @{user.githubUsername}
          {user.aiRequestCredits ? (
            <>
              <span className="text-muted-foreground/80"> • </span>
              <span className="text-muted-foreground/80">
                {user.aiRequestCredits}/50 ai requests remaining
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground/80"> • </span>
              <span className="text-muted-foreground/80">
                No AI credits remaining &mdash; credits refreshed daily
              </span>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
