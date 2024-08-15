import { useCopyToClipboard } from "@/hooks";
import { cn } from "@/utils";
import { CheckIcon, CopyIcon, Link2Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useWebhoncConnectionId } from "./queries";

export function WebhoncBadge() {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const [isHovering, setIsHovering] = useState(false);

  const { data: url, isPending } = useWebhoncConnectionId();

  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          className={cn(
            "rounded-xl flex items-center text-sm gap-2 cursor-pointer h-7",
            {
              "bg-green-950/60 hover:bg-green-900/60 text-green-400": !!url,
              "bg-muted/20 text-muted-foreground": !url,
            },
          )}
          onClick={() => copyToClipboard(url!)}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          title="Copy public URL to clipboard"
        >
          {isCopied ? (
            <CheckIcon className="w-4 h-4" />
          ) : isHovering ? (
            <CopyIcon className="w-4 h-4" />
          ) : (
            <Link2Icon className="w-4 h-4" />
          )}
          <span>
            Public URL
            <span className="max-sm:hidden">{url ? " active" : ""}</span>
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        sideOffset={5}
        className="rounded-xl border bg-background z-10 text-card-foreground/75"
      >
        <div className="grid gap-4 p-4">
          <div className="font-normal text-sm w-[400px] flex flex-col gap-2">
            <div className="pb-1">
              {isPending || url === undefined ? (
                <div className="flex gap-2 items-center">
                  <div className="p-2 bg-background/5 border rounded overflow-scroll text-nowrap font-mono">
                    Loading...
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="p-2 bg-background/5 border rounded overflow-hidden text-nowrap font-mono text-ellipsis">
                    {url}
                  </div>
                </div>
              )}
            </div>
            <h6 className="font-semibold">Public URL</h6>
            <p className="text-wrap text-sm">
              Any request received at this URL will be forwarded to your app
              including all the request data (path, headers, body, etc.).
            </p>
            <p className="text-wrap text-sm">
              E.g.: A request{" "}
              <code className="font-mono text-wrap">
                &lt;public_url&gt;/some-route{" "}
              </code>
              will be forwarded to your app:
              <code className="font-mono text-wrap">
                {" "}
                &lt;your_app&gt;/some-route
              </code>
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
