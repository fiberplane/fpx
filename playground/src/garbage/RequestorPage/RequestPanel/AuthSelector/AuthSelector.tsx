import { Button } from "@/components/ui/button";
import { KeyRoundIcon, Settings2Icon } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-xs font-thin">
        Select your preferred auth method/option for this request. You can
        manage your auth configurations on the &nbsp;
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2Icon size={16} />
          settings
        </Button>{" "}
        page.
      </p>
      <div className="grid text-xs">
        {authorizations.length === 0 ? (
          <div className="flex items-center justify-center">
            <div className="text-xs text-center text-muted-foreground border rounded-md flex flex-col p-2 gap-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <KeyRoundIcon size="16" />
                No additional auth configurations defined
              </h4>
              <p>
                You may want to
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                >
                  Add
                </Button>{" "}
                one on the settings page.
              </p>
            </div>
          </div>
        ) : (
          <div className="border rounded-md p-4 grid gap-4">
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
        )}
      </div>
    </div>
  );
}
