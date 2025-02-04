import type { Authorization } from "../../store/slices/settingsSlice";
import { BearerForm } from "./BearerForm";

export function AuthForm(props: { auth: Authorization; isNew?: boolean }) {
  const { auth, isNew } = props;
  if (auth.type === "bearer") {
    return (
      <BearerForm
        id={auth.id}
        token={auth.token}
        name={auth.name}
        isNew={isNew}
      />
    );
  }

  return <div>Not supported ({auth.type})</div>;
}
