import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useCreateApiKey, useDeleteApiKey, useGetApiKeys } from "./queries";

export function ApiKeyList() {
  const [newKeyName, setNewKeyName] = useState("");
  const { toast } = useToast();

  const { data: apiKeysResponse, isLoading } = useGetApiKeys();

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
    return <div>Loading...</div>;
  }

  const apiKeys = apiKeysResponse;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">API Keys</h2>
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
            <TableHead>Actions</TableHead>
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
                  variant="destructive"
                  onClick={() => revokeApiKey(key.id)}
                >
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
