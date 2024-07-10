import { KeyValueRow } from "../KeyValueForm";
import { createChangeEnabled } from "../KeyValueForm/data";
import {
  ChangeKeyValueParametersHandler,
  KeyValueParameter,
} from "../KeyValueForm/types";
import { createChangePathParamValue } from "./data";

type Props = {
  keyValueParameters: KeyValueParameter[];
  onChange: ChangeKeyValueParametersHandler;
};

/**
 * This is like a KeyValueForm, but all of the parameter keys are fixed (cannot be changed),
 * and none of the entries can be fully removed.
 *
 * Remember: Path params are *computed* from the route pattern.
 */
export const PathParamForm = (props: Props) => {
  const { onChange, keyValueParameters } = props;

  return (
    <div className="space-y-2">
      {keyValueParameters.map((parameter) => {
        const isDraft = !parameter.value;
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
            onChangeValue={createChangePathParamValue(
              onChange,
              keyValueParameters,
              parameter,
            )}
            // TOOD - Change this to reset the value?
            // removeValue={() => {
            //   onChange(
            //     keyValueParameters.filter(({ id }) => parameter.id !== id),
            //   );
            // }}
          />
        );
      })}
    </div>
  );
};
