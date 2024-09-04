import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, noop } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  createChangeEnabled,
  createChangeKey,
  createChangeValue,
  isDraftParameter,
} from "./data";
import type {
  ChangeKeyValueParametersHandler,
  KeyValueParameter,
} from "./types";
import "./styles.css";
import { CodeMirrorInput } from "@/components/Timeline/DetailsList/CodeMirrorEditor";

type Props = {
  keyValueParameters: KeyValueParameter[];
  onChange: ChangeKeyValueParametersHandler;
};

type KeyValueRowProps = {
  isDraft: boolean;
  parameter: KeyValueParameter;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeKey?: (key: string) => void;
  onChangeValue: (value: string) => void;
  removeValue?: () => void;
};

export const KeyValueRow = (props: KeyValueRowProps) => {
  const {
    isDraft,
    onChangeEnabled,
    onChangeKey,
    onChangeValue,
    removeValue,
    parameter,
  } = props;
  const { enabled, key, value } = parameter;
  const [isHovering, setIsHovering] = useState(false);
  return (
    <div
      className="flex items-center space-x-0 rounded p-0"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Checkbox
        className="mr-1"
        checked={enabled}
        disabled={isDraft}
        onCheckedChange={() => {
          const handler = isDraft ? noop : () => onChangeEnabled(!enabled);
          return handler();
        }}
      />
      <CodeMirrorInput
        // type="text"
        value={key}
        placeholder="name"
        // className="w-28 h-8 bg-transparent shadow-none px-2 py-0 text-sm border-none"
        // readOnly={!onChangeKey}
        onChange={(value) => onChangeKey?.(value ?? "")}
        // className="w-28 h-8 bg-transparent shadow-none text-sm border-none"
      />
      <Input
        type="text"
        value={value}
        placeholder="value"
        onChange={(e) => onChangeValue(e.target.value)}
        className="h-8 w-full bg-transparent shadow-none px-2 py-0 text-sm border-none"
      />
      <div
        className={cn("ml-1 flex invisible", {
          visible: !isDraft && isHovering && !!removeValue,
        })}
      >
        <TrashIcon
          className={cn("w-4 h-4", {
            "cursor-pointer": !isDraft,
          })}
          onClick={() => !isDraft && removeValue?.()}
        />
      </div>
    </div>
  );
};

export const KeyValueForm = (props: Props) => {
  const { onChange, keyValueParameters } = props;

  return (
    <div className="flex flex-col gap-0">
      {keyValueParameters.map((parameter) => {
        const isDraft = isDraftParameter(parameter);
        return (
          <KeyValueRow
            key={parameter.id}
            parameter={parameter}
            isDraft={isDraft}
            onChangeEnabled={createChangeEnabled(
              onChange,
              keyValueParameters,
              parameter,
            )}
            onChangeKey={createChangeKey(
              onChange,
              keyValueParameters,
              parameter,
            )}
            onChangeValue={createChangeValue(
              onChange,
              keyValueParameters,
              parameter,
            )}
            removeValue={() => {
              onChange(
                keyValueParameters.filter(({ id }) => parameter.id !== id),
              );
            }}
          />
        );
      })}
    </div>
  );
};

interface DynamicInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MAGIC_INPUT_HEIGHT = "1.5em";

/**
 * A stretchy input, modeled after the ones in HTTPie
 */
const DynamicInput: React.FC<DynamicInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (inputRef.current && measureRef.current) {
      if (inputRef.current.innerText !== value) {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const startOffset = range?.startOffset;

        inputRef.current.innerText = value;
        measureRef.current.innerText = value;

        if (selection && range && startOffset !== undefined) {
          const newRange = document.createRange();
          newRange.setStart(
            inputRef.current.firstChild || inputRef.current,
            Math.min(startOffset, value.length),
          );
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      adjustHeight();
    }
  }, [value, isFocused]);

  const adjustHeight = () => {
    if (inputRef.current && measureRef.current) {
      measureRef.current.style.width = `${inputRef.current.offsetWidth}px`;
      const height = measureRef.current.offsetHeight;
      inputRef.current.style.height = `${height}px`;
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      const newValue = inputRef.current.innerText;
      if (newValue !== value) {
        onChange(newValue);
      }
      if (measureRef.current) {
        measureRef.current.innerText = newValue;
      }
      adjustHeight();
    }
  };

  return (
    <div className="relative">
      <div
        ref={measureRef}
        aria-hidden="true"
        className="absolute top-0 left-0 py-0 px-2 invisible whitespace-pre-wrap break-words"
        style={{
          minHeight: MAGIC_INPUT_HEIGHT,
          maxHeight: isFocused ? "none" : MAGIC_INPUT_HEIGHT,
        }}
      />
      <div
        ref={inputRef}
        contentEditable
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onInput={handleInput}
        className={cn(
          `min-h-[${MAGIC_INPUT_HEIGHT}] py-0 px-2 border rounded`,
          "focus-visible:outline-none",
          "fpx-placeholder",
          !isFocused && "overflow-hidden",
          !isFocused &&
            `max-h-[${MAGIC_INPUT_HEIGHT}] text-ellipsis whitespace-nowrap`,
          {
            "border border-blue-500 ring-2 ring-blue-300": isFocused,
            "border border-gray-600": !isFocused,
            "text-ellipsis whitespace-nowrap": !isFocused,
          },
          className,
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
};
