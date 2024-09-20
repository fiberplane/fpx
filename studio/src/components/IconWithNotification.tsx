import { cn } from "@/utils";
import { Icon, type IconProps } from "@iconify/react";
import type React from "react";

interface IconWithNotificationProps extends IconProps {
  notificationColor?: string;
  notificationSize?: number;
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
  notificationSize = 10,
  notificationPosition = "top-right",
  notificationContent,
  showNotification = true,
  ...iconProps
}) => {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Icon {...iconProps} />
      {showNotification && (
        <div
          className={cn(
            notificationColor,
            "shadow-sm",
            "absolute flex justify-center items-center text-[7px] leading-[1.5em]",
            "px-[2px] font-bold rounded-[50%]",
            `min-w-[${notificationSize}px] h-[${notificationSize}px]`,
            notificationPosition === "top-right" && "-top-1 -right-1",
            notificationPosition === "top-left" && "-top-1 -left-1",
            notificationPosition === "bottom-right" && "-bottom-1 -right-1",
            notificationPosition === "bottom-left" && "-bottom-1 -left-1",
          )}
          // style={getNotificationStyle()}
          aria-hidden="true"
        >
          {notificationContent}
        </div>
      )}
    </div>
  );
};

export default IconWithNotification;
