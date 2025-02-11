import FpThemeIllustrationDark from "@/assets/FpThemeIllustrationDark.svg";
import FpThemeIllustrationLight from "@/assets/FpThemeIllustrationLight.svg";
import FpThemeIllustrationSystem from "@/assets/FpThemeIllustrationSystem.svg";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

interface ThemeOptionProps {
  value: "light" | "dark" | "system";
  label: string;
}

function ThemeOption({ value, label }: ThemeOptionProps) {
  const Illustration =
    value === "light"
      ? FpThemeIllustrationLight
      : value === "dark"
        ? FpThemeIllustrationDark
        : FpThemeIllustrationSystem;
  return (
    <div className="relative flex items-start">
      <Label
        htmlFor={value}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-lg p-2",
          "data-[state=checked]:bg-accent/5",
          "[&:has([data-state=checked])]:bg-accent/5",
        )}
      >
        <Illustration className="w-full h-auto mb-2" />
        <div className="flex items-center gap-2 w-full justify-start">
          <RadioGroupItem
            value={value}
            id={value}
            className={cn(
              "h-3.5 w-3.5",
              "border border-muted-foreground/70",
              "data-[state=checked]:border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
            )}
          />
          <span className="text-sm font-normal text-foreground/70">
            {label}
          </span>
        </div>
      </Label>
    </div>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroup
      defaultValue={theme}
      onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
      className="flex gap-6"
    >
      <ThemeOption value="system" label="System" />
      <ThemeOption value="dark" label="Dark" />
      <ThemeOption value="light" label="Light" />
    </RadioGroup>
  );
}
