export const KeyboardShortcutKey = ({
  children,
}: { children: React.ReactNode }) => {
  return (
    <kbd className="flex border-[1px] border-gray-300 items-center text-xs justify-center font-mono text-white bg-accent/90 p-0.5 rounded opacity-60 h-4 min-w-4">
      {children}
    </kbd>
  );
};
