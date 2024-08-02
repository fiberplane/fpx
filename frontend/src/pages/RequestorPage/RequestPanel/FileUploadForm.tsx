import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { FilePlusIcon } from "@radix-ui/react-icons";
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
      className="flex flex-col items-center justify-center h-full border border-dashed border-gray-500 rounded-md p-4"
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
              "mt-2 cursor-pointer bg-slate-500 text-white px-3 py-1 rounded text-sm",
              "hover:bg-slate-600",
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
          <p className="mt-2 text-sm text-gray-400">{file.name}</p>
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
