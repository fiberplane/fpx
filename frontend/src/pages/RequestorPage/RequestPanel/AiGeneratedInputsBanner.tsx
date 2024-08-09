import { Button } from "@/components/ui/button";
import { Cross2Icon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Dispatch, SetStateAction } from "react";

type AIGeneratedInputsBannerProps = {
  showAiGeneratedInputsBanner: boolean;
  setShowAiGeneratedInputsBanner: Dispatch<SetStateAction<boolean>>;
  setIgnoreAiInputsBanner: Dispatch<SetStateAction<boolean>>;
};

export function AIGeneratedInputsBanner({
  showAiGeneratedInputsBanner,
  setShowAiGeneratedInputsBanner,
  setIgnoreAiInputsBanner,
}: AIGeneratedInputsBannerProps) {
  const onClose = () => {
    setShowAiGeneratedInputsBanner(false);
  };

  const onDontShowAgain = () => {
    setIgnoreAiInputsBanner(true);
  };

  if (!showAiGeneratedInputsBanner) {
    return null;
  }

  return (
    <div className="bg-primary/20 text-blue-300 text-sm px-2.5 py-2 rounded-md grid grid-cols-[auto_1fr_auto] gap-2 mb-4">
      <div className="py-0.5">
        <InfoCircledIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col items-start justify-start">
        <span className="font-normal">Inputs generated by AI</span>
        <span className="font-light"> Hit send to view output.</span>
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
