import type { AuthorizationBearer } from "../../store/slices/settingsSlice";
import { MaskedText } from "./MaskedText";

export const BearerAuthorizationItem = (
  props: Pick<AuthorizationBearer, "id" | "name" | "token">,
) => {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
      Bearer
      <div className="font-mono">
        <MaskedText text={props.token} />
      </div>
    </div>
  );
};
