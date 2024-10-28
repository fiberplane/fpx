import { Button } from "@/components/ui/button";
import { ErrorView } from "./ErrorView";
import { useCallback, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { createWorkspaceConfig, openWorkspaceByPath } from "../utils";
import { RuntimeContext } from "../../RuntimeProvider";

type ConfigFileMissingProps = {
  path: string;
  reset: () => void;
};

export function ConfigFileMissing({ path, reset }: ConfigFileMissingProps) {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <ErrorView>
      {showWizard ? (
        <ConfigWizard path={path} reset={reset} />
      ) : (
        <>
          <strong>
            Missing <code>fpx.toml</code> in path <code>{path}</code>
          </strong>
          <Button className="flex gap-1" onClick={() => setShowWizard(true)}>
            Create <code>fpx.toml</code>
          </Button>
          <Button variant="secondary" onClick={reset}>
            Cancel
          </Button>
        </>
      )}
    </ErrorView>
  );
}

const WizardStateSchema = z.object({
  listenPort: z.number().min(0).max(65535),
});

type WizardState = z.infer<typeof WizardStateSchema>;

function ConfigWizard({ path, reset }: ConfigFileMissingProps) {
  const runtime = useContext(RuntimeContext);

  const { handleSubmit, register } = useForm<WizardState>({
    defaultValues: {
      listenPort: 8788,
    },
  });

  const onSubmit = useCallback(
    ({ listenPort }: WizardState) => {
      (async () => {
        try {
          const success = await createWorkspaceConfig(
            // @ts-expect-error
            Number.parseInt(listenPort as string),
            path,
          );

          if (success) {
            if (runtime && "requestOpenWorkspaceByPath" in runtime) {
              reset();
              runtime.requestOpenWorkspaceByPath(path);
            }
          } else {
            // TODO:
            console.log("failed");
          }
        } catch (error) {
          console.log(error);
        }
      })();
    },
    [path, runtime],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("listenPort")} />
      <Button type="submit">Save</Button>
    </form>
  );
}
