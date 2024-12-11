import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Method } from "@/pages/RequestorPage/RequestorHistory";
import { useRoutes } from "@/pages/RequestorPage/routes";
import { useStudioStore } from "@/pages/RequestorPage/store";
import { useAddItemToCollection } from "@/queries";
import { useHandler } from "@fiberplane/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { z } from "zod";

type Props = {
  collectionId: string;
  onSuccess: () => void;
};

const ValidationSchema = z.object({
  routes: z.array(z.number({ coerce: true })).nonempty(),
});

type AddRouteFormData = z.infer<typeof ValidationSchema>;

export function AddRouteForm(props: Props) {
  const { collectionId, onSuccess } = props;
  const { mutate: addAppRoute } = useAddItemToCollection(collectionId);

  const { isLoading } = useRoutes();
  const { appRoutes: routes } = useStudioStore("appRoutes");
  const { handleSubmit, register } = useForm<AddRouteFormData>({
    resolver: zodResolver(ValidationSchema),
  });

  const onInvalid: SubmitErrorHandler<AddRouteFormData> = useHandler(
    (errors) => {
      console.log("errors", errors);
      setRoutesErrors(["Select at least one route."]);
    },
  );

  const [routesErrors, setRoutesErrors] = useState<Array<string>>([]);
  const onSubmit: SubmitHandler<AddRouteFormData> = async (formData) => {
    await Promise.all(
      formData.routes.map((id) =>
        addAppRoute({
          routeId: id,
          extraParams: {},
        }),
      ),
    );
    console.log("all good?!?");
    onSuccess();
  };

  if (isLoading || !routes) {
    return <div>Loading...</div>;
  }

  if (routes.length === 0) {
    return <div>Empty</div>;
  }

  const routeProps = register("routes");
  return (
    <div className="max-h-60 grid grid-rows-[auto_auto_1fr] gap-2">
      <h4 className="text-lg text-center">Add route</h4>
      <p>Select which routes to add.</p>
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="grid min-h-0 gap-2"
      >
        <div className="grid gap-2 overflow-auto">
          {routes.map((route, index) => {
            const id = `route-${route.id.toString()}`;
            return (
              <div
                key={index}
                className="grid grid-cols-[1rem_auto] items-center gap-2"
              >
                <Input
                  className="cursor-pointer h-6"
                  type="checkbox"
                  id={id}
                  value={route.id}
                  {...routeProps}
                />
                <Label
                  className="grid grid-cols-[3.5rem_auto] items-center gap-2 cursor-pointer"
                  htmlFor={id}
                >
                  <Method method={route.method} />
                  <div>{route.path}</div>
                </Label>
              </div>
            );
          })}
        </div>
        <div>
          {routesErrors.map((route, index) => {
            return <div key={index}>{route}</div>;
          })}
        </div>
        <Button type="submit">Add</Button>
      </form>
    </div>
  );
}
