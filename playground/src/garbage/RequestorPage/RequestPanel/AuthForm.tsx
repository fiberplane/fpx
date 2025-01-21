import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRoundIcon } from "lucide-react";
import { useStudioStore } from "../store";
import type {
  Authorization,
  BearerAuthorization,
} from "../store/slices/settingsSlice";

export function AuthForm() {
  const { authorizations } = useStudioStore("authorizations");
  const [selection, setSelection] = useState<string | null>(null);

  return (
    <div className="grid px-2 text-xs">
      {/* <h2>Authorization</h2>
      <div className="grid gap-2 border rounded-lg p-4 text-xs"> */}
      <AuthorizationOption
        value="none"
        checked={selection === null}
        onSelect={() => setSelection(null)}
      >
        None
      </AuthorizationOption>
      {authorizations.map((authorization) => {
        return (
          <AuthorizationItem key={authorization.id} {...authorization} onSelect={setSelection} />
        );
      })}
      {/* </div> */}
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
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
      <Input
        id={value}
        type="radio"
        name="option"
        value={value}
        checked={checked}
        onSelect={() => onSelect(value)}
        className="peer"
      />
      <label htmlFor={value} className="grid gap-2 cursor-pointer text-muted-foreground peer-checked:text-foreground">
        {children}
      </label>
    </div>
  );
};

const AuthorizationItem = (props: Authorization & {
  onSelect: (value: string) => void;

}) => {
  const { onSelect, ...rest } = props;
  if (rest.type === "bearer") {
    return (
      <AuthorizationOption
        value={props.id}
        onSelect={(value) => onSelect(value)}
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
      <div>
        <MaskedText text={props.token} />
      </div>
    </div>
  );
};

import { Input } from "@/components/ui/input";
import type { ReactNode } from "@tanstack/react-router";
import { useState } from "react";

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
      <span className="font-mono text-sm">
        {isVisible ? text : maskText(text)}
      </span>
      <Button
        type="button"
        size="icon"
        variant={"ghost"}
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      </Button>
    </div>
  );
};
