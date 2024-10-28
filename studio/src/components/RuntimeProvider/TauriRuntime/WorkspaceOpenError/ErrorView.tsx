import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

export function ErrorView({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <Card className="flex flex-col gap-4 p-8 max-w-md">{children}</Card>
    </div>
  );
}
