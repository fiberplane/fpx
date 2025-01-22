import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function MaskedText({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <div className="font-mono text-sm block text-ellipsis whitespace-nowrap overflow-hidden">
        {isVisible ? text : maskText(text)}
      </div>
      <Button
        type="button"
        size="icon"
        variant={"ghost"}
        onClick={() => setIsVisible(!isVisible)}
        className="h-auto p-2"
      >
        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </Button>
    </div>
  );
}

function maskText(text: string): string {
  if (text.length <= 2) {
    return text;
  }

  return `${text[0]}${"•".repeat(text.length - 2)}${text[text.length - 1]}`;
}
