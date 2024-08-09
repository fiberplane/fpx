export const CountBadge = ({ count }: { count: number }) => {
  return (
    <span className="text-gray-400 font-normal bg-muted-foreground/20 rounded px-1.5 inline-block ml-2">
      {count}
    </span>
  );
};
