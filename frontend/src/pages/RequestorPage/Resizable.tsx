import "react-resizable/css/styles.css"; // Import the styles for the resizable component

import { forwardRef } from "react";

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ResizableHandle = forwardRef<HTMLDivElement, ResizableHandleProps>(
  (props, ref) => (
    <div
      ref={ref}
      className="w-[15px] h-full cursor-ew-resize top-0 right-[-8px] absolute z-10"
      {...props}
    />
  ),
);
