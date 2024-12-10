import { Icon } from "@iconify/react";
import { AddRoute } from "../AddRoute";

export function EmptyCollectionItemsList(props: { collectionId: string }) {
  const { collectionId } = props;
  return (
    <div className="text-sm text-muted-foreground py-4 px-3 my-2 flex gap-4 items-center flex-col">
      <h4 className="flex items-center gap-3 justify-center text-base">
        <Icon icon="lucide:folder" />
        Empty collection
        <Icon icon="lucide:folder" />
      </h4>
      <div className="flex max-w-64 flex-col gap-2 text-left">
        <p className="text-muted-foreground">Awesome, you can now:</p>
        <ul className="ml-1.5 pl-2 list-disc my-2 gap-2 grid leading-6">
          <li>
            navigate to any route and use the&nbsp;&nbsp;
            <Icon
              icon="lucide:folder"
              className="text-foreground inline-block"
            />{" "}
            to add it the collection. You can find this button on the top right
            corner of a page (if available)
          </li>
          <li>
            or add a route using the following button
            <AddRoute collectionId={collectionId} />
          </li>
        </ul>
      </div>
    </div>
  );
}
