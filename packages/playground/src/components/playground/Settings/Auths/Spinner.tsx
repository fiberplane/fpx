import { useStickyLoading } from "@/hooks";
import { cn } from "@/utils";
import { LoaderCircle } from "lucide-react";
import { useChangedSticky } from "./useChangedSticky";

export function Spinner(props: { spinning: boolean; className?: string }) {
  const { spinning, className: extraClassName } = props;

  // sticky is used for how long the spinner should be full visible
  const rotationDuration = 1000;
  // Valid tailwind transition durations
  type Duration = 0 | 75 | 100 | 150 | 200 | 300 | 500 | 700 | 1000;

  const fadeOutDuration: Duration = 500;
  const sticky = useStickyLoading(spinning, rotationDuration - fadeOutDuration);
  const fadeOutAnimation = useChangedSticky(sticky, fadeOutDuration);

  const className = cn(
    "transition-opacity",
    `[transition-duration:${fadeOutDuration}ms]`,
    sticky ? "opacity-100" : "opacity-0",
    "hover:opacity-100",
    extraClassName,
  );

  const animationDuration = `[animation-duration:${rotationDuration}ms]`;
  const svgClassName = cn(
    animationDuration,
    (sticky || fadeOutAnimation) && "animate-spin",
  );

  return (
    <div className={className}>
      <LoaderCircle className={svgClassName} />
    </div>
  );
}
