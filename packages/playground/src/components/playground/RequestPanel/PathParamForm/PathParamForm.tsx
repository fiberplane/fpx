import { KeyValueFormRow } from "../../KeyValueForm";
import { createChangeEnabled } from "../../KeyValueForm/data";
import type { ChangeKeyValueParametersHandler } from "../../KeyValueForm/types";
import type { KeyValueParameter } from "../../store";
import { createChangePathParamValue } from "./data";

type Props = {
  keyValueParameters: KeyValueParameter[];
  onChange: ChangeKeyValueParametersHandler;
  onSubmit?: () => void;
  keyPlaceholder?: string;
  handleCmdG?: () => void;
  handleCmdB?: () => void;
};

/**
 * This is like a KeyValueForm, but all of the parameter keys are fixed (cannot be changed),
 * and none of the entries can be fully removed.
 *
 * Remember: Path params are *computed* from the route pattern.
 */
export const PathParamForm = (props: Props) => {
  const {
    onChange,
    keyValueParameters,
    onSubmit,
    keyPlaceholder,
    handleCmdG,
    handleCmdB,
  } = props;

  return (
    <div className="space-y-2">
      {keyValueParameters.map((parameter) => {
        const isDraft = !parameter.value;
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
            onChangeValue={createChangePathParamValue(
              onChange,
              keyValueParameters,
              parameter,
            )}
            onSubmit={onSubmit}
            keyPlaceholder={keyPlaceholder}
            handleCmdG={handleCmdG}
            handleCmdB={handleCmdB}
          />
        );
      })}
    </div>
  );
};
