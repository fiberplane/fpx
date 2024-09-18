import type React from "react";
import { Icon, type IconProps } from "@iconify/react";
import { cn } from "@/utils";

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
  const getNotificationStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      minWidth: `${notificationSize}px`,
      height: `${notificationSize}px`,
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      fontSize: `${notificationSize * 0.7}px`,
      fontWeight: "bold",
      padding: "0 2px",
    };

    const positionStyle: React.CSSProperties = {
      "top-left": { top: -2, left: -2 },
      "top-right": { top: -2, right: -2 },
      "bottom-left": { bottom: -2, left: -2 },
      "bottom-right": { bottom: -2, right: -2 },
    }[notificationPosition];

    return { ...baseStyle, ...positionStyle };
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Icon {...iconProps} />
      {showNotification && (
        <div
          className={cn(notificationColor, "shadow-sm")}
          style={getNotificationStyle()}
          aria-hidden="true"
        >
          {notificationContent}
        </div>
      )}
    </div>
  );
};

export default IconWithNotification;
