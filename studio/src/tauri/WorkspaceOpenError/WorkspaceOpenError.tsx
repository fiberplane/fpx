import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OpenWorkspaceError } from "@fiberplane/fpx-types";
import type { ReactNode } from "react";

type WorkspaceOpenErrorProps = {
  error: OpenWorkspaceError;
  reset: () => void;
};

export function WorkspaceOpenError({ error, reset }: WorkspaceOpenErrorProps) {
  switch (error.type) {
    case "ConfigFileMissing":
      return <ConfigFileMissing path={error.path} reset={reset} />;
    case "InvalidConfiguration":
      return <InvalidConfiguration message={error.message} reset={reset} />;
  }
}

function ConfigFileMissing({
  path,
  reset,
}: { path: string; reset: () => void }) {
  return (
    <View>
      <strong>
        Missing <code>fpx.toml</code> in path <code>{path}</code>
      </strong>
      <Button onClick={reset}>Close</Button>
    </View>
  );
}

function InvalidConfiguration({
  message,
  reset,
}: { message: string; reset: () => void }) {
  return (
    <View>
      <strong>
        Invalid <code>fpx.toml</code>
      </strong>
      <pre>{message}</pre>
      <Button onClick={reset}>Close</Button>
    </View>
  );
}

function View({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <Card className="flex flex-col gap-4 p-8 max-w-md">{children}</Card>
    </div>
  );
}
