import { CodeMirrorInput } from "@/components/CodeMirrorEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn, noop } from "@/utils";
import { FileIcon, TrashIcon } from "@radix-ui/react-icons";
import { useCallback, useRef, useState } from "react";
import {
  createChangeEnabled,
  createChangeKey,
  createChangeValue,
  isDraftParameter,
} from "./data";
import type {
  ChangeFormDataParametersHandler,
  FormDataParameter,
} from "./types";

type Props = {
  keyValueParameters: FormDataParameter[];
  onChange: ChangeFormDataParametersHandler;
  onSubmit?: () => void;
};

type FormDataRowProps = {
  isDraft: boolean;
  parameter: FormDataParameter;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeKey?: (key: string) => void;
  onChangeValue: (value: FormDataParameter["value"]) => void;
  removeValue?: () => void;
  onSubmit?: () => void;
};

const FormDataFormRow = (props: FormDataRowProps) => {
  const {
    isDraft,
    onChangeEnabled,
    onChangeKey,
    onChangeValue,
    removeValue,
    parameter,
    onSubmit,
  } = props;
  const { enabled, key, value } = parameter;
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onChangeValue({ value: file, type: "file", name: file.name });
      }
    },
    [onChangeValue],
  );

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
        className="w-[140px]"
        value={key}
        placeholder="form_key"
        readOnly={!onChangeKey}
        onChange={(value) => onChangeKey?.(value ?? "")}
        onSubmit={onSubmit}
      />
      {value.type === "text" && (
        <CodeMirrorInput
          className="w-[calc(100%-140px)]"
          value={value.value}
          placeholder="value"
          onChange={(value) =>
            onChangeValue({ value: value ?? "", type: "text" })
          }
          onSubmit={onSubmit}
        />
      )}
      {value.type === "file" && (
        <div className="h-8 flex-grow bg-transparent shadow-none px-2 py-0 text-sm border-none">
          <Button variant="secondary" className="h-8">
            <FileIcon className="w-3 h-3 mr-2" />
            {value.name}
          </Button>
        </div>
      )}
      {!(value.type === "file" && !!value.value) && (
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

export const FormDataForm = (props: Props) => {
  const { onChange, keyValueParameters, onSubmit } = props;

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
            onSubmit={onSubmit}
          />
        );
      })}
    </div>
  );
};
