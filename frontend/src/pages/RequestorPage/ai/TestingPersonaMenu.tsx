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
import { GearIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";
import { AiTestingPersona, FRIENDLY, HOSTILE } from "./ai";

type TestingPersonaMenuProps = {
  persona: string;
  onPersonaChange: (persona: AiTestingPersona) => void;
};

export function TestingPersonaMenu({
  persona,
  onPersonaChange,
}: TestingPersonaMenuProps) {
  // Appease typescript by ensuring that the selected testing persona is a known persona type
  const handleValueChange = useCallback(
    (value: string) => {
      onPersonaChange(value === HOSTILE ? HOSTILE : FRIENDLY);
    },
    [onPersonaChange],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <GearIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Testing Persona</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={persona}
          onValueChange={handleValueChange}
        >
          <DropdownMenuRadioItem value="Friendly">
            Friendly
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="QA">Hostile</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
