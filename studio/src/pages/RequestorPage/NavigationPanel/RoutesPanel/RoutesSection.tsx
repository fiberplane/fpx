type RoutesSectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

export function RoutesSection(props: RoutesSectionProps) {
  const { title, children } = props;

  return (
    <section className="p-2 w-full">
      <h4 className="font-medium font-mono text-xs text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-0.5 overflow-y-auto mt-2 w-full overflow-x-hidden">
        {children}
      </div>
    </section>
  );
}
