import type { CodeMirrorInputType } from "@/components/CodeMirrorEditor/CodeMirrorInput";
import type { KeyValueParameter } from "../store";
import { KeyValueFormRow } from "./KeyValueFormRow";
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
          <KeyValueFormRow
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
