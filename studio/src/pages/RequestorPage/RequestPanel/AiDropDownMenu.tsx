import SparkleWand from "@/assets/SparkleWand.svg";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isMac } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { CaretDownIcon } from "@radix-ui/react-icons";
import { useCallback, useEffect, useState } from "react";
import { type AiTestingPersona, FRIENDLY, HOSTILE } from "../ai";

type AiDropDownMenuProps = {
  isLoadingParameters: boolean;
  persona: string;
  onPersonaChange: (persona: AiTestingPersona) => void;
  fillInRequest: () => void;
};

export function AiDropDownMenu({
  isLoadingParameters,
  persona,
  onPersonaChange,
  fillInRequest,
}: AiDropDownMenuProps) {
  const [open, setOpen] = useState(false);

  const handleValueChange = useCallback(
    (value: string) => {
      onPersonaChange(value === HOSTILE ? HOSTILE : FRIENDLY);
    },
    [onPersonaChange],
  );

  const handleGenerateRequest = useHandler(() => {
    fillInRequest();
    setOpen(false);
  });

  // When the user shift+clicks of meta+clicks on the trigger,
  // automatically open the menu
  // I'm doing this because the caret is kinda hard to press...
  const { isMetaOrShiftPressed } = useIsMetaOrShiftPressed();
  const handleMagicWandButtonClick = useHandler(() => {
    if (!open && isMetaOrShiftPressed) {
      setOpen(true);
      return;
    }

    fillInRequest();
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="p-2 h-auto"
              size="sm"
              onClick={handleMagicWandButtonClick}
            >
              <SparkleWand
                className={cn("w-4 h-4", { "fpx-pulse": isLoadingParameters })}
              />
            </Button>
            <DropdownMenuTrigger asChild>
              <button type="button">
                <CaretDownIcon className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
          align="start"
        >
          Generate
          <div className="flex gap-0.5">
            <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
            <KeyboardShortcutKey>G</KeyboardShortcutKey>
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="min-w-60">
        <DropdownMenuLabel>Generate Inputs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal">
          Testing Persona
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={persona}
          onValueChange={handleValueChange}
        >
          <DropdownMenuRadioItem
            value="Friendly"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonaChange(FRIENDLY);
            }}
          >
            Friendly
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="QA"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPersonaChange(HOSTILE);
            }}
          >
            Hostile
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <Button
            style={{
              background: "linear-gradient(90deg, #3B82F6 0%, #C53BF6 100%)",
            }}
            className="w-full text-white flex gap-2 items-center"
            // FIXME - While it's loading... show a spinner? And implement a timeout / cancel
            disabled={isLoadingParameters}
            onClick={handleGenerateRequest}
          >
            <SparkleWand className="w-4 h-4" />
            <span>{isLoadingParameters ? "Generating..." : "Generate"}</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useIsMetaOrShiftPressed() {
  const [isMetaOrShiftPressed, setIsMetaOrShiftPressed] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.shiftKey) {
      setIsMetaOrShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.metaKey && !e.shiftKey) {
      setIsMetaOrShiftPressed(false);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsMetaOrShiftPressed(false);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur]);

  return {
    isMetaOrShiftPressed,
  };
}
