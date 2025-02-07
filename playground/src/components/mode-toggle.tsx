import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FpDropdownMenu,
  FpDropdownMenuContent,
  FpDropdownMenuItem,
  FpDropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <FpDropdownMenu>
        <FpDropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-transparent"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </FpDropdownMenuTrigger>
        <FpDropdownMenuContent align="end">
          <FpDropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </FpDropdownMenuItem>
          <FpDropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </FpDropdownMenuItem>
          <FpDropdownMenuItem onClick={() => setTheme("system")}>
            System
          </FpDropdownMenuItem>
        </FpDropdownMenuContent>
      </FpDropdownMenu>
    </div>
  );
}
