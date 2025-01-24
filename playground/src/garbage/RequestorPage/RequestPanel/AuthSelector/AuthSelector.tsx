import { Button } from "@/components/ui/button";
import { KeyRoundIcon, PlusIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  getPreferredAuthorizationId,
  useStudioStore,
  useStudioStoreRaw,
} from "../../store";
import { AuthorizationItem } from "./AuthorizationItem";
import { AuthorizationOption } from "./AuthorizationOption";

export function AuthSelector() {
  const { authorizations, setAuthorizationId, setSettingsOpen } =
    useStudioStore(
      "authorizations",
      "authorizationId",
      "setAuthorizationId",
      "setSettingsOpen",
    );

  const preferredAuthorizationId = useStudioStoreRaw(
    useShallow((state) =>
      getPreferredAuthorizationId(state.authorizationId, state.authorizations),
    ),
  );

  if (authorizations.length === 0) {
    return (
      <div className="h-[100vh] max-h-full flex items-center justify-center text-muted-foreground text-xs">
        <div className="flex items-center justify-start">
          <div className="text-xs text-center text-muted-foreground flex flex-col p-2 gap-2">
            <div className="flex flex-col gap-4 items-center justify-center">
              {/* <div className="text-foreground-muted bg-muted p-2 aspect-square rounded-md "> */}
              <div className="p-2 mb-2 rounded-lg">

                <KeyRoundIcon size="40" className="block" />
              </div>
              {/* </div> */}
              <h4 className="text-lg font-normal mb-2">
                No additional auth configurations defined.
              </h4>
            </div>
            <p>
              <Button
                variant="link"
                size="sm"
                className="text-inherit font-normal cursor-pointer grid gap-2 grid-cols-[auto_auto]"

                onClick={() => setSettingsOpen(true)}
              >
                <PlusIcon />
                <span>
                  Add in settings
                </span>
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="text-muted-foreground text-xs">
        Select your preferred auth method/option for this request.
      </div>
      <div className="grid text-xs">
        <div className="border-y grid">
          {authorizations.map((authorization) => {
            return (
              <AuthorizationItem
                key={authorization.id}
                checked={preferredAuthorizationId === authorization.id}
                {...authorization}
                onSelect={setAuthorizationId}
              />
            );
          })}
          <AuthorizationOption
            value="none"
            checked={preferredAuthorizationId === "none"}
            onSelect={() => setAuthorizationId("none")}
          >
            None
          </AuthorizationOption>
        </div>
        <div>
          <Button
            type="button"
            variant={"link"}
            className="text-inherit font-normal cursor-pointer grid gap-2 grid-cols-[auto_auto] px-0"
            // className="text-info/70 hover:text-info transition-colors"
            onClick={() => setSettingsOpen(true)}
          >
            <PlusIcon />
            <span>
              Add in settings
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
