import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChangeKeyValueParametersHandler, KeyValueParameter } from "./types";
import { createChangeEnabled, createChangeKey, createChangeValue, isDraftParameter, noop } from "./data";

type Props = {
  keyValueParameters: KeyValueParameter[];
  onChange: ChangeKeyValueParametersHandler;
};

type KeyValueRowProps = {
  isDraft: boolean;
  parameter: KeyValueParameter;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeKey: (key: string) => void;
  onChangeValue: (value: string) => void;
  removeValue: () => void;
};


const KeyValueRow = (props: KeyValueRowProps) => {
  const {
    isDraft,
    onChangeEnabled,
    onChangeKey,
    onChangeValue,
    removeValue, // TODO - Implement removal
    parameter,
  } = props;
  const { enabled, key, value } = parameter;

  return (
    <div className="flex items-center space-x-0 rounded bg-muted px-1 py-2">
      <Checkbox className="mr-1" checked={enabled} disabled={isDraft} onCheckedChange={() => {
        const handler = isDraft ? noop : () => onChangeEnabled(!enabled);
        return handler();
      }} />
      <Input type="text" value={key} placeholder="name" onChange={e => onChangeKey(e.target.value)} className="w-24 bg-transparent shadow-none px-2 py-0 text-sm border-none" />
      <Input type="text" value={value} placeholder="value" onChange={e => onChangeValue(e.target.value)} className="flex-grow bg-transparent shadow-none px-2 py-0 text-sm border-none" />
    </div>
  )
}

export const KeyValueForm = (props: Props) => {
  const { onChange, keyValueParameters } = props;

  return (
    <div className="space-y-2">
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
              parameter
            )}
            onChangeKey={createChangeKey(
              onChange,
              keyValueParameters,
              parameter
            )}
            onChangeValue={createChangeValue(
              onChange,
              keyValueParameters,
              parameter
            )}
            removeValue={() => {
              onChange(
                keyValueParameters.filter(({ id }) => parameter.id !== id)
              );
            }}
          />
        );
      })}
    </div>
  );
};

