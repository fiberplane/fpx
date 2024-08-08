import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { FileIcon, FilePlusIcon } from "@radix-ui/react-icons";
import { useCallback } from "react";

type FileUploadFormProps = {
  file?: File;
  onChange: (file?: File) => void;
};

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  file,
  onChange,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    onChange(selectedFile);
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files?.[0];
      onChange(droppedFile);
    },
    [onChange],
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full max-h-[300px] border border-dashed border-gray-500/50 rounded-lg p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {!file ? (
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <FilePlusIcon className="w-12 h-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-400">
            Choose a file or drop it here
          </p>
          <label
            htmlFor="file-upload"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              "px-4 py-2 rounded text-sm",
              "border border-input bg-background/60 shadow-sm hover:bg-accent hover:text-accent-foreground",
              "mt-2 cursor-pointer",
              "text-gray-100",
              "border-none",
            )}
          >
            Choose file
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <div className="flex flex-col justify-center items-center gap-2 text-sm text-gray-400">
            <FileIcon className="w-4 h-4" />
            {file.name}
          </div>
          <Button
            className="mt-2 cursor-pointer text-white rounded text-sm px-2 py-1"
            variant="destructive"
            onClick={() => {
              onChange(undefined);
            }}
          >
            Remove file
          </Button>
        </div>
      )}
    </div>
  );
};
