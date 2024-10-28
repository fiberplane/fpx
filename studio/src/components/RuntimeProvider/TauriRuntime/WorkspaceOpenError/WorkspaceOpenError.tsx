import { Button } from "@/components/ui/button";
import type { OpenWorkspaceError } from "@fiberplane/fpx-types";
import { ErrorView } from "./ErrorView";
import { ConfigFileMissing } from "./ConfigFileMissing";

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

function InvalidConfiguration({
  message,
  reset,
}: { message: string; reset: () => void }) {
  return (
    <ErrorView>
      <strong>
        Invalid <code>fpx.toml</code>
      </strong>
      <pre>{message}</pre>
      <Button onClick={reset}>Close</Button>
    </ErrorView>
  );
}
