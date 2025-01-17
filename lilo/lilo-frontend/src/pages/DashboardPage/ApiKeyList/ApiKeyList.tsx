import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useCreateApiKey, useDeleteApiKey, useGetApiKeys } from "./queries";

export function ApiKeyList() {
  const [newKeyName, setNewKeyName] = useState("");
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useGetApiKeys();

  const { mutate: createApiKey } = useCreateApiKey();
  const { mutate: revokeApiKey } = useDeleteApiKey();

  const generateApiKey = () => {
    if (!newKeyName) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    createApiKey({ name: newKeyName });
    setNewKeyName("");
  };

  if (isLoading) {
    return <ApiKeySkeleton />;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">API Keys</h2>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Enter API key name"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <Button onClick={generateApiKey}>Generate API Key</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys?.map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell>{key.token}</TableCell>
              <TableCell>{new Date(key.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 p-4"
                  onClick={() => revokeApiKey(key.id)}
                >
                  <TrashIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ApiKeySkeleton() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">API Keys</h2>
      <div className="flex space-x-4 mb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-10" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
