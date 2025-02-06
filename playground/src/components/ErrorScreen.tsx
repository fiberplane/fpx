import { Icon } from "@iconify/react";

export function ErrorScreen(props: {
  error: Error;
  title: string;
  message: string;
}) {
  const { error: _error, message } = props;
  const title = props.title ?? "Error";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <Icon
          icon="lucide:alert-triangle"
          width={48}
          height={48}
          className="text-danger"
        />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
