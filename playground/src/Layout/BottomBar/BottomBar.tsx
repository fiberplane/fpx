import FiberplaneLogo from "@/assets/fiberplane-logo-orange.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DISCORD_INVITE_URL } from "@/constants";
import { useSettingsOpen } from "@/hooks";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { SettingsMenu } from "../Settings";
import { FloatingSidePanel } from "../SidePanel";
import { SidePanelTrigger } from "../SidePanel";

export function BottomBar() {
  const { setSettingsOpen } = useSettingsOpen();
  return (
    <nav className="gap-4 bg-muted/50 py-2">
      <div className="flex justify-between px-2 items-center">
        <div className="flex items-center gap-2 sm:static sm:h-auto border-0 bg-transparent text-sm">
          <div className="flex items-center gap-2">
            <SidePanelTrigger />
            <SettingsMenu setSettingsOpen={setSettingsOpen} />
          </div>
          <FloatingSidePanel />
        </div>

        <div className="flex items-center justify-center gap-1.5 h-6">
          <FiberplaneLogo className="w-5 h-5" />
          <span className="sr-only text-xs text-foreground/80">Fiberplane</span>
        </div>

        <div className="flex items-center gap-2">
          <BottomBarExternalLink
            href={DISCORD_INVITE_URL}
            icon={<DiscordLogoIcon className="w-3.5 h-3.5" />}
            label="Fiberplane Discord"
          />
          <BottomBarExternalLink
            href="https://github.com/fiberplane/fiberplane"
            icon={<Icon icon="lucide:github" className={cn("h-3.5 w-3.5")} />}
            label="Fiberplane GitHub"
          />
        </div>
      </div>
    </nav>
  );
}

export function BottomBarExternalLink(props: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className={cn(
            "h-6 w-6 flex items-center justify-center hover:bg-accent/20 rounded-sm",
          )}
          href={props.href}
          target="_blank"
          rel="noreferrer"
        >
          {props.icon}
        </a>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="px-2 py-1.5 text-sm flex gap-2 items-center"
        align="center"
      >
        <p>{props.label}</p>
        {/* <div className="flex gap-1 items-center">
                <KeyboardShortcutKey>G</KeyboardShortcutKey>
                <span className="text-xs font-mono">then</span>
                <KeyboardShortcutKey>I</KeyboardShortcutKey>
              </div> */}
      </TooltipContent>
    </Tooltip>
  );
}
