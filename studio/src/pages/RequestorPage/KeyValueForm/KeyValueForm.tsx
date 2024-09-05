import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, noop } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
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
      <Input
        type="text"
        value={key}
        placeholder="name"
        readOnly={!onChangeKey}
        onChange={(e) => onChangeKey?.(e.target.value)}
        className="w-28 h-8 bg-transparent shadow-none px-2 py-0 text-sm border-none"
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
