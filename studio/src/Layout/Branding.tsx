import FpLogo from "@/assets/fp-logo.svg";

export function Branding() {
  return (
    <div className="flex items-center border-l pl-2">
      <a
        href="https://fiberplane.com"
        className="flex items-center gap-2 overflow-hidden group"
      >
        <FpLogo className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground [&>path]:text-muted" />
        <span className="text-sm text-muted-foreground/60 group-hover:text-muted-foreground">
          Fiberplane
        </span>
      </a>
    </div>
  );
}
