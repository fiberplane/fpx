import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeOptionProps {
  value: "light" | "dark" | "system";
  label: string;
  icon: LucideIcon;
}

function ThemeOption({ value, label, icon: Icon }: ThemeOptionProps) {
  return (
    <div>
      <RadioGroupItem value={value} id={value} className="peer sr-only" />
      <Label
        htmlFor={value}
        className={cn(
          "flex flex-col items-center justify-between rounded-md border-2",
          "border-muted bg-popover p-4 hover:bg-accent/10 hover:text-accent-foreground",
          "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
        )}
      >
        <Icon className="mb-3 h-6 w-6" />
        <span className="text-sm font-medium">{label}</span>
      </Label>
    </div>
  );
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroup
      defaultValue={theme}
      onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
      className="grid grid-cols-3 gap-4"
    >
      <ThemeOption value="light" label="Light" icon={Sun} />
      <ThemeOption value="dark" label="Dark" icon={Moon} />
      <ThemeOption value="system" label="System" icon={Monitor} />
    </RadioGroup>
  );
}
