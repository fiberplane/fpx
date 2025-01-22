import type { ReactNode } from "@tanstack/react-router";

export const AuthorizationOption = ({
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
    <label className="grid grid-cols-[auto_1fr] gap-2 items-center cursor-pointer overflow-hidden text-muted-foreground hover:text-foreground">
      <input
        id={value}
        type="radio"
        name="option"
        value={value}
        checked={checked}
        onChange={(event) => event.target.checked && onSelect(value)}
        className="peer"
      />
      <div className="grid gap-2 peer-checked:text-foreground">{children}</div>
    </label>
  );
};
