export const CountBadge = ({ count }: { count: number }) => {
  return (
    <span
      className="text-gray-400
    font-normal
    bg-muted-foreground/20
    rounded
    px-1.5
    inline-block
    min-w-5
    "
    >
      {count}
    </span>
  );
};
