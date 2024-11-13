import { cn } from "@/utils";

export const KeyboardShortcutKey = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <kbd
      className={cn(
        "flex border border-gray-300 items-center text-xs justify-center font-sans text-white bg-accent/90 p-0.5 rounded opacity-60 h-4 min-w-4",
        className,
      )}
    >
      {children}
    </kbd>
  );
};
