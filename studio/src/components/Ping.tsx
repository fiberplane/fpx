import { cn } from "@/utils";

const Ping: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("relative inline-flex", className)} role="status">
      <div className="w-4 h-4">
        <div className="absolute w-full h-full rounded-full bg-blue-500 opacity-75 animate-ping" />
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-blue-500" />
      </div>
      <span className="sr-only">Awaiting signal...</span>
    </div>
  );
};

export default Ping;
