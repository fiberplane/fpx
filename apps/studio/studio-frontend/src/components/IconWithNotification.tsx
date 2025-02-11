import { cn } from "@/utils";
import { Icon, type IconProps } from "@iconify/react";
import type React from "react";

interface IconWithNotificationProps extends IconProps {
  notificationColor?: string;
  notificationPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
  notificationContent?: string | number;
  showNotification?: boolean;
}

const IconWithNotification: React.FC<IconWithNotificationProps> = ({
  notificationColor = "bg-red-500",
  notificationPosition = "top-right",
  notificationContent,
  showNotification = true,
  ...iconProps
}) => {
  return (
    <div className="relative">
      <Icon {...iconProps} />
      {showNotification && (
        <div
          className={cn(
            notificationColor,
            "shadow-sm",
            "absolute flex justify-center items-center text-[7px] leading-[1]",
            "font-bold rounded-full overflow-hidden",
            "w-[10px] h-[10px]",
            notificationPosition === "top-right" && "-top-1 -right-1",
            notificationPosition === "top-left" && "-top-1 -left-1",
            notificationPosition === "bottom-right" && "-bottom-1 -right-1",
            notificationPosition === "bottom-left" && "-bottom-1 -left-1",
          )}
          aria-hidden="true"
        >
          {notificationContent}
        </div>
      )}
    </div>
  );
};

export default IconWithNotification;
