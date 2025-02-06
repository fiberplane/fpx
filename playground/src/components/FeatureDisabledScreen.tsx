import { Icon } from "@iconify/react";

export function FeatureDisabledScreen(props: {
  error: Error;
  title?: string;
  message: string;
}) {
  const { error: _error, message } = props;
  const title = props.title ?? "Feature Disabled";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <Icon
          icon="lucide:lock"
          width={48}
          height={48}
          className="text-muted-foreground"
        />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-foreground/70 text-center max-w-md">{message}</p>
        </div>
      </div>
    </div>
  );
}
