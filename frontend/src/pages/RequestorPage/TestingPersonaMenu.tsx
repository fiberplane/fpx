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

type TestingPersonaMenuProps = {
  persona: string;
  onPersonaChange: (persona: string) => void;
};

export function TestingPersonaMenu({
  persona,
  onPersonaChange,
}: TestingPersonaMenuProps) {
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
        <DropdownMenuRadioGroup value={persona} onValueChange={onPersonaChange}>
          <DropdownMenuRadioItem value="Friendly">
            Friendly
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="QA">Hostile</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
