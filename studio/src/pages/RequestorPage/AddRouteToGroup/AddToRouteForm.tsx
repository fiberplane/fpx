import { Button } from "@/components/ui/button";
import { useRequestorStore } from "@/pages/RequestorPage/store";
import { useAddRouteToGroup, useGroups } from "@/queries";
import type { Group } from "@fiberplane/fpx-types";

type Props = {
  // groupId: string;
  onSuccess: () => void;
};

export function AddToRouteForm(props: Props) {
  // console.log(props);
  // const { groupId, onSuccess } = props;
  // const { mutate: addAppRoute } = useAddRouteToGroup(groupId);
  const { data: groups, isLoading } = useGroups();
  // const { isLoading } = useRoutes();
  // const { routes } = useRequestorStore("routes");
  // const { handleSubmit, register } = useForm<AddToRouteForm>({
  //   resolver: zodResolver(ValidationSchema),
  // });

  // const onInvalid: SubmitErrorHandler<AddToRouteForm> = useHandler(
  //   (errors) => {
  //     console.log("errors", errors);
  //     // const value = errors.root?.message ? [errors.root?.message] : errors.routes?.message ? [errors.routes.message] : [];
  //     setRoutesErrors(["Select at least one route."]);
  //     // console.log('errors', errors)
  //   },
  // );

  // const [routesErrors, setRoutesErrors] = useState<Array<string>>([]);
  // // console.log("routes", routes, isLoading);
  // const onSubmit: SubmitHandler<AddToRouteForm> = async (formData) => {
  //   // if (formData.routes.length) {
  //   console.log(formData.routes);
  //   await Promise.all(formData.routes.map((id) => addAppRoute(id)));
  //   console.log("all good?!?");
  //   onSuccess();
  // };

  if (isLoading || !groups) {
    return <div>Loading...</div>;
  }

  if (groups.length === 0) {
    return <div>Empty</div>;
  }
  // console.log("routesERrors", routesErrors);
  // const routeProps = register("routes");
  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg text-center">Add To Group</h4>
      <p>Select which group to add the current request to</p>
      <div className="grid min-h-0 gap-2">
        <div className="grid gap-2 overflow-auto">
          {groups.map((group) => {
            return (
              <AddToRouteFormItem
                key={group.id}
                group={group}
                onSuccess={props.onSuccess}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// function AddRouteItem(props: Route)
function AddToRouteFormItem(props: { group: Group; onSuccess: () => void }) {
  const { group } = props;
  const { mutate: addGroup } = useAddRouteToGroup(group.id.toString());
  const { activeRoute } = useRequestorStore("activeRoute");
  if (!activeRoute) {
    return null;
  }

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2">
      <div>{group.name}</div>
      <Button
        size={"icon-xs"}
        onClick={() => {
          addGroup(activeRoute?.id);
          props.onSuccess();
        }}
      >
        +
      </Button>
    </div>
  );
}
