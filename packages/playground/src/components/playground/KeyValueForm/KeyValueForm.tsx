import { CodeMirrorInput } from "@/components/CodeMirrorEditor";
import type { CodeMirrorInputType } from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { Checkbox } from "@/components/ui/checkbox";
import { isSupportedSchemaObject } from "@/lib/isOpenApi";
import { cn, noop } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { KeyValueParameter } from "../store";
import {
  createChangeEnabled,
  createChangeKey,
  createChangeValue,
  isDraftParameter,
} from "./data";
import type { ChangeKeyValueParametersHandler } from "./types";

type Props = {
  keyValueParameters: KeyValueParameter[];
  onChange: ChangeKeyValueParametersHandler;
  onSubmit?: () => void;
  keyPlaceholder?: string;
  keyInputType?: CodeMirrorInputType;
  valueInputType?: CodeMirrorInputType;
  handleCmdG?: () => void;
  handleCmdB?: () => void;
};

type KeyValueRowProps = {
  isDraft: boolean;
  keyValueData: KeyValueParameter;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeKey?: (key: string) => void;
  onChangeValue: (value: string) => void;
  removeValue?: () => void;
  onSubmit?: () => void;
  handleCmdG?: () => void;
  handleCmdB?: () => void;
  keyPlaceholder?: string;
  keyInputType?: CodeMirrorInputType;
  valueInputType?: CodeMirrorInputType;
};

export const KeyValueRow = (props: KeyValueRowProps) => {
  const {
    isDraft,
    onChangeEnabled,
    onChangeKey,
    onChangeValue,
    removeValue,
    keyValueData,
    onSubmit,
    handleCmdG,
    handleCmdB,
    keyPlaceholder = "name",
    keyInputType,
    valueInputType,
  } = props;
  const { enabled, key, value, parameter } = keyValueData;
  const [isHovering, setIsHovering] = useState(false);

  const schema =
    parameter.schema && isSupportedSchemaObject(parameter.schema)
      ? parameter.schema
      : undefined;
  return (
    <div
      className={cn("flex items-center space-x-0 rounded p-0")}
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
        className="w-[140px]"
        value={key}
        placeholder={keyPlaceholder}
        readOnly={!onChangeKey}
        onChange={(value) => onChangeKey?.(value ?? "")}
        onSubmit={onSubmit}
        inputType={keyInputType}
        handleCmdG={handleCmdG}
        handleCmdB={handleCmdB}
      />
      {schema?.enum ? (
        <div className="flex flex-wrap gap-2 flex-1">
          {schema.enum.map((enumValue) => (
            <label
              key={`${keyValueData.id}_${enumValue}`}
              className="grid grid-cols-[auto_1fr] gap-2 items-center cursor-pointer overflow-hidden text-muted-foreground hover:text-foreground"
            >
              <input
                type="radio"
                name={keyValueData.id}
                value={value}
                checked={value === enumValue}
                onChange={() => {
                  onChangeValue(enumValue);
                }}
                className="peer"
              />
              <div className="grid gap-2 peer-checked:text-foreground">
                {enumValue}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <CodeMirrorInput
          className="w-[calc(100%-140px)]"
          value={value}
          placeholder="value"
          onChange={(value) => onChangeValue(value ?? "")}
          onSubmit={onSubmit}
          inputType={valueInputType}
          handleCmdG={handleCmdG}
          handleCmdB={handleCmdB}
        />
      )}
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
  const {
    onChange,
    keyValueParameters,
    onSubmit,
    keyPlaceholder,
    keyInputType,
    valueInputType,
    handleCmdG,
    handleCmdB,
  } = props;

  return (
    <div className="flex flex-col gap-0">
      {keyValueParameters.map((parameter) => {
        const isDraft = isDraftParameter(parameter);
        return (
          <KeyValueRow
            key={parameter.id}
            keyValueData={parameter}
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
            onSubmit={onSubmit}
            keyPlaceholder={keyPlaceholder}
            keyInputType={keyInputType}
            valueInputType={valueInputType}
            handleCmdG={handleCmdG}
            handleCmdB={handleCmdB}
          />
        );
      })}
    </div>
  );
};
