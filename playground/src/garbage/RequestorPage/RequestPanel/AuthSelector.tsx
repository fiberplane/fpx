import type { ReactNode } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRoundIcon, Settings2Icon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  getPreferredAuthorizationId,
  useStudioStore,
  useStudioStoreRaw,
} from "../store";
import type {
  Authorization,
  BearerAuthorization,
} from "../store/slices/settingsSlice";

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
      <div className="grid px-2 text-xs gap-2">
        {authorizations.length === 0 ? (
          <div className="flex items-center justify-center">
            <div className="text-xs text-center text-muted-foreground border rounded-md flex flex-col p-2 gap-2">
              <h4 className="flex items-center gap-2 font-semibold"><KeyRoundIcon size="16" />No additional auth configurations defined</h4>
              <p>You may want to
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                >
                  Add
                </Button>{" "}
                one on the settings page.</p>
            </div>
          </div>
        ) : (<>
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
        </>)
        }
      </div>
    </div>
  );
}

const AuthorizationOption = ({
  children,
  value,
  onSelect,
  checked,
}: {
  children: ReactNode;
  value: string;
  onSelect: (value: string) => void;
  checked?: boolean;
}) => {
  return (
    <label className="grid grid-cols-[auto_1fr] gap-2 items-center cursor-pointer overflow-hidden">
      <input
        id={value}
        type="radio"
        name="option"
        value={value}
        checked={checked}
        onChange={(event) => event.target.checked && onSelect(value)}
        className="peer"
      />
      <div className="grid gap-2 text-muted-foreground peer-checked:text-foreground">
        {children}
      </div>
    </label>
  );
};

const AuthorizationItem = (
  props: Authorization & {
    onSelect: (value: string) => void;
    checked?: boolean;
  },
) => {
  const { onSelect, checked, ...rest } = props;

  if (rest.type === "bearer") {
    return (
      <AuthorizationOption
        value={props.id}
        onSelect={(value) => onSelect(value)}
        checked={checked}
      >
        <BearerAuthorizationItem {...rest} />
      </AuthorizationOption>
    );
  }

  return null;
};

const BearerAuthorizationItem = (
  props: Pick<BearerAuthorization, "id" | "name" | "token">,
) => {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
      <KeyRoundIcon size={16} className="text-muted-foreground" />
      <div className="font-mono">
        <MaskedText text={props.token} />
      </div>
    </div>
  );
};

function maskText(text: string): string {
  if (text.length <= 2) {
    return text;
  }

  return `${text[0]}${"•".repeat(text.length - 2)}${text[text.length - 1]}`;
}

const MaskedText = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
      <div className="font-mono text-sm block text-ellipsis whitespace-nowrap overflow-hidden">
        {isVisible ? text : maskText(text)}
      </div>
      <Button
        type="button"
        size="icon"
        variant={"ghost"}
        onClick={() => setIsVisible(!isVisible)}
        className="h-auto p-2"
      >
        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </Button>
    </div>
  );
};
