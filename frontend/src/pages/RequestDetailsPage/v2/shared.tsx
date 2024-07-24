export const SubSection = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col gap-2">{children}</div>;
};

export const SubSectionHeading = ({
  children,
}: { children: React.ReactNode }) => {
  return <div className="font-semibold text-sm">{children}</div>;
};

export const Divider = () => {
  return <div className="h-[1px] w-full bg-muted/80" />;
};
