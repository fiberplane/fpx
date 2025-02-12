import type { Authorization } from "../../store/slices/settingsSlice";
import { AuthorizationOption } from "./AuthorizationOption";
import { BearerAuthorizationItem } from "./BearerAuthorizationItem";

export const AuthorizationItem = (
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
