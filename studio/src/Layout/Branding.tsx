import FpLogo from "@/assets/fp-logo.svg";

export function Branding() {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <FpLogo className="w-4 h-4 text-muted-foreground/60 [&>path]:text-muted" />
      <span className="text-sm text-muted-foreground/60">Fiberplane</span>
    </div>
  );
}
