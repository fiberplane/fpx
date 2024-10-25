import { Button } from "@/components/ui/button";
import { Cross2Icon, InfoCircledIcon } from "@radix-ui/react-icons";
import type { Dispatch, SetStateAction } from "react";

type ViewLogsBannerProps = {
  showViewLogsBanner: boolean;
  setShowViewLogsBanner: (showViewLogsBanner: boolean) => void;
  setIgnoreViewLogsBanner: Dispatch<SetStateAction<boolean>>;
};

export function ViewLogsBanner({
  showViewLogsBanner,
  setShowViewLogsBanner,
  setIgnoreViewLogsBanner,
}: ViewLogsBannerProps) {
  const onClose = () => {
    setShowViewLogsBanner(false);
  };

  const onDontShowAgain = () => {
    setIgnoreViewLogsBanner(true);
  };

  if (!showViewLogsBanner) {
    return null;
  }

  return (
    <div className="bg-primary/20 text-blue-300 text-sm px-2.5 py-2 rounded-md grid grid-cols-[auto_1fr_auto] gap-2 mb-4">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start">
        <span className="font-normal">Timeline will Tell</span>
        <span className="font-light">
          Type <code>G</code> then <code>T</code> to view the timeline for this
          request.
        </span>
        <button
          className="underline mt-2 font-light"
          onClick={onDontShowAgain}
          type="button"
        >
          Don&rsquo;t show again
        </button>
      </div>
      <div>
        <Button
          className="p-0 h-auto"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <Cross2Icon className="w-3.5 h-3.5 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}
