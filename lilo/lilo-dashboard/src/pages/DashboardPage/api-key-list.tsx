import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

type ApiKey = {
  id: string
  name: string
  key: string
  createdAt: string
}

export function ApiKeyList() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const { toast } = useToast()

  const generateApiKey = () => {
    if (!newKeyName) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      })
      return
    }

    const newKey: ApiKey = {
      id: Math.random().toString(36).substr(2, 9),
      name: newKeyName,
      key: `lilo_${Math.random().toString(36).substr(2, 32)}`,
      createdAt: new Date().toISOString(),
    }

    setApiKeys([...apiKeys, newKey])
    setNewKeyName("")
    toast({
      title: "API Key Generated",
      description: "Your new API key has been created successfully.",
    })
  }

  const revokeApiKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id))
    toast({
      title: "API Key Revoked",
      description: "The API key has been revoked successfully.",
    })
  }

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
                <Button variant="destructive" onClick={() => revokeApiKey(key.id)}>
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

