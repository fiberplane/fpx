import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, noop } from "@/utils";
import { FileIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState, useRef } from "react";
import {
  createChangeEnabled,
  createChangeKey,
  createChangeValue,
  isDraftParameter,
} from "./data";
import { ChangeKeyValueParametersHandler, KeyValueParameter } from "./types";
import { Button } from "@/components/ui/button";

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
  onChangeFile: (file: File) => void;
};
export const FormDataFormRow = (props: KeyValueRowProps) => {
  const {
    isDraft,
    onChangeEnabled,
    onChangeKey,
    onChangeValue,
    removeValue,
    parameter,
    onChangeFile,
  } = props;
  const { enabled, key, value } = parameter;
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChangeFile(file);
    }
  };

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
        className="w-24 h-8 bg-transparent shadow-none px-2 py-0 text-sm border-none"
      />
      <Input
        type="text"
        value={value}
        placeholder="value"
        onChange={(e) => onChangeValue(e.target.value)}
        className="h-8 flex-grow bg-transparent shadow-none px-2 py-0 text-sm border-none"
      />
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileIcon className="w-4 h-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
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

export const FormDataForm = (props: Props) => {
  const { onChange, keyValueParameters } = props;

  return (
    <div className="flex flex-col gap-0">
      {keyValueParameters.map((parameter) => {
        const isDraft = isDraftParameter(parameter);
        return (
          <FormDataFormRow
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
            onChangeFile={() => {}}
          />
        );
      })}
    </div>
  );
};