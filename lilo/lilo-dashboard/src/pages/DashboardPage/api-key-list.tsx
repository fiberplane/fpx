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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import { useState } from "react";
import type { ApiKeysRouter } from "../../../../lilo-worker/src/routes/internal/api/api-keys";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  createdAt: string;
};

const apiKeysClient = hc<ApiKeysRouter>("/internal/api-keys");

function useDeleteApiKey() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiKeysClient.keys[":id"].$delete({
        param: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been revoked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });
}

export function ApiKeyList() {
  const [newKeyName, setNewKeyName] = useState("");
  const { toast } = useToast();

  const {
    data: apiKeys,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiKeysClient.index.$get(),
  });

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

    const newKey: ApiKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: newKeyName,
      key: `lilo_${Math.random().toString(36).substr(2, 32)}`,
      createdAt: new Date().toISOString(),
    };

    // setApiKeys([...apiKeys, newKey])
    setNewKeyName("");
    toast({
      title: "API Key Generated",
      description: "Your new API key has been created successfully.",
    });
  };

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
          {apiKeys.map((key) => (
            <TableRow key={key.id}>
              <TableCell>{key.name}</TableCell>
              <TableCell>{key.key}</TableCell>
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
