import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RequestPanelProps {
  method: string;
  path: string;
}

export function RequestPanel({ method, path }: RequestPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* URL Bar */}
      <div className="flex items-center gap-2">
        <div className="w-24">
          <Input
            value={method}
            readOnly
            className="font-mono text-sm bg-muted"
          />
        </div>
        <Input value={path} readOnly className="font-mono text-sm flex-1" />
        <Button variant="default">Send</Button>
      </div>

      {/* Request Configuration Tabs */}
      <div className="flex border-b border-border">
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-primary"
        >
          Params
        </Button>
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-transparent"
        >
          Headers
        </Button>
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-transparent"
        >
          Body
        </Button>
        <Button
          variant="ghost"
          className="px-4 py-2 -mb-px border-b-2 border-transparent"
        >
          Docs
        </Button>
      </div>

      {/* Request Configuration Content */}
      <div className="flex-1 min-h-0">
        {/* Params Content */}
        <div className="h-full">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-2 font-medium">Name</th>
                <th className="text-left py-2 font-medium">Value</th>
                <th className="text-left py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">
                  <Input placeholder="name" className="h-8" />
                </td>
                <td className="py-2">
                  <Input placeholder="value" className="h-8" />
                </td>
                <td className="py-2">
                  <Input placeholder="description" className="h-8" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
