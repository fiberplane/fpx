import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { forwardRef, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  onItemSelect: (index: number) => void;
  itemCount: number;
};

export const Search = forwardRef<HTMLInputElement, SearchProps>(
  (
    { value, onChange, onFocus, onBlur, placeholder, onItemSelect, itemCount },
    ref,
  ) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const isSearchInputFocused = document.activeElement === inputRef.current;

    useHotkeys(
      ["Enter", "Escape"],
      (event) => {
        switch (event.key) {
          case "Enter":
            if (isSearchInputFocused && itemCount > 0) {
              setSelectedIndex(0);
              onItemSelect(0);
            } else if (selectedIndex !== null) {
              onItemSelect(selectedIndex);
            }
            break;
          case "Escape":
            if (isSearchInputFocused) {
              inputRef.current?.blur();
            } else if (value) {
              onChange("");
            } else {
              setSelectedIndex(null);
            }
            break;
        }
      },
      { enableOnFormTags: ["input"] },
    );

    return (
      <div className="relative flex-grow">
        <Input
          // merge the passed in and internal refs
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={cn("peer", "text-sm", "pl-24 focus:pl-2", value && "pl-2")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {!value && (
          <div className="peer-focus:hidden absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <span className="text-muted-foreground text-xs">Type</span>
            <KeyboardShortcutKey>/</KeyboardShortcutKey>
            <span className="text-muted-foreground text-xs">
              to search {placeholder}
            </span>
          </div>
        )}
      </div>
    );
  },
);

Search.displayName = "Search";
