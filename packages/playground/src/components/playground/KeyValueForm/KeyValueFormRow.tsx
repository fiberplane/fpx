import {
  CodeMirrorInput,
  type CodeMirrorInputType,
} from "@/components/CodeMirrorEditor/CodeMirrorInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FpLabel } from "@/components/ui/label";
import { FpRadioGroup, FpRadioGroupItem } from "@/components/ui/radio-group";
import { isSupportedSchemaObject } from "@/lib/isOpenApi";
import { cn, noop } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import type { KeyValueParameter } from "../store";

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

export const KeyValueFormRow = (props: KeyValueRowProps) => {
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

  const schema =
    parameter.schema && isSupportedSchemaObject(parameter.schema)
      ? parameter.schema
      : undefined;
  return (
    <div className={cn("flex items-center gap-1 rounded p-0", "group")}>
      <Checkbox
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
        <FpRadioGroup
          defaultValue={value}
          onValueChange={(value) => onChangeValue(value)}
          className="flex flex-wrap gap-2 w-[calc(100%-140px)]"
        >
          {schema.enum.map((enumValue) => (
            <FpLabel
              key={enumValue}
              className={cn(
                "grid grid-cols-[auto_1fr] gap-2 items-center overflow-hidden",
                "cursor-pointer text-muted-foreground hover:text-foreground first:ml-2",
              )}
            >
              <FpRadioGroupItem id={enumValue} value={enumValue} />
              {enumValue}
            </FpLabel>
          ))}
        </FpRadioGroup>
      ) : schema && (schema.type === "number" || schema.type === "integer") ? (
        <div className="w-[calc(100%-140px)]">
          <Input
            value={value}
            type="number"
            placeholder="value"
            step={schema.type === "integer" ? 1 : undefined}
            min={schema.minimum}
            max={schema.maximum}
            className="p-0 pl-1.5 border-transparent [&:not(:focus)]:no-spinner focus-visible:ring-primary shadow-none h-7 invalid:[&:not(:focus)]:border-danger invalid:[&:not(:focus)]:animate-shake"
            onChange={(event) => onChangeValue(event.target.value)}
          />
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
        className={cn("flex invisible items-center", {
          "group-focus-within:visible group-hover:visible":
            !isDraft && !!removeValue,
        })}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-3.5 w-3.5 p-0.5 cursor-pointer enabled:hover:bg-transparent transition-color
          text-muted-foreground"
          disabled={isDraft}
          onClick={() => !isDraft && removeValue?.()}
        >
          <TrashIcon
            className={cn("w-4 h-4", {})}
            onClick={() => !isDraft && removeValue?.()}
          />
        </Button>
      </div>
    </div>
  );
};
