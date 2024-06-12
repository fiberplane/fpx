import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import Editor from "@monaco-editor/react"; // Import Monaco Editor
import { Button } from "@/components/ui/button";

// import { RequestMethodCombobox } from "./RequestMethodCombobox";

type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
};

function getProbedRoutes(): Promise<ProbedRoute[]> {
  return fetch("/v0/app-routes").then(r => r.json());
}

function makeRequest({ path, method, body }: {
  path: string;
  method: string;
  body: string;
}) {
  return fetch("/v0/requestor-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      method,
      body,
    }),
  }).then(r => r.json());
}

export const RequestorPage = () => {
  const { data: routes, isLoading } = useQuery({ queryKey: ['appRoutes'], queryFn: getProbedRoutes })

  const [selectedRoute, setSelectedRoute] = useState<ProbedRoute | null>(null);

  const handleRouteClick = (route: ProbedRoute) => {
    setSelectedRoute(route);
  };

  useEffect(() => {
    const shouldAutoselectRoute = !isLoading && routes?.length && selectedRoute === null
    if (shouldAutoselectRoute) {
      const autoselectedRoute = routes.find(r => r.path === "/") ?? routes[0];
      setSelectedRoute(autoselectedRoute);
    }
  }, [routes, isLoading, selectedRoute])

  // TODO - Making a request 
  // Access the client
  const queryClient = useQueryClient()

  // Queries

  // Mutations
  const mutation = useMutation({
    mutationFn: makeRequest,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['requestorRequests'] })
    },
  })

  // const { data: requestorRequests } = useQuery({
  //   queryKey: ['requestorRequests'],
  //   queryFn: () => fetch("/v0/requestor-requests").then(r => r.json()),
  // })

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedRoute) {
      mutation.mutate({
        path: selectedRoute.path,
        method: selectedRoute.method,
        body: ""
        // body: editor.getValue(),
      })
    }
  }

  return (
    <div className="flex h-full">
      <SideBar routes={routes} selectedRoute={selectedRoute} handleRouteClick={handleRouteClick} />
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <RequestInput method={selectedRoute?.method} path={selectedRoute?.path} onSubmit={onSubmit}/>
        <div className="flex flex-grow">
          <RequestMeta />
          <ResponseDetails />
        </div>
      </div>
    </div>
  );
};

export default RequestorPage;

type SidebarProps = {
  routes?: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
}

function SideBar({ routes, selectedRoute, handleRouteClick }: SidebarProps) {
  return (
    <div className="w-64 bg-muted text-gray-700 flex flex-col px-4 rounded">
      <div className="flex items-center h-10 rounded font-semibold">
        Routes
      </div>
      <div className="flex-grow">
        <div className="space-y-0">
          {routes?.map?.((route, index) => (
            <div
              key={index}
              onClick={() => handleRouteClick(route)}
              className={cn('flex items-center p-1 rounded cursor-pointer font-mono text-sm', {
                'bg-gray-300': selectedRoute === route,
                'hover:bg-gray-200': selectedRoute !== route,
              })}            >
              <span className={cn("text-xs", getHttpMethodTextColor(route.method))}>{route.method}</span>
              <span className="ml-2">{route.path}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-auto">
        {/* Settings? */}
      </div>
    </div>
  )
}

type RequestInputProps = {
  method?: string;
  path?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function RequestInput({ method = "GET", path, onSubmit }: RequestInputProps) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const url = `http://localhost:8787${path ?? ""}`;
    setValue(url)
  }, [path])

  return (
    <div className="px-4">
      <form onSubmit={onSubmit} className="flex items-center justify-between rounded bg-muted">
        <div className="flex flex-grow items-center space-x-2">
          {/* <RequestMethodCombobox /> */}
          <span className={cn("text-white px-4 py-1 rounded font-mono", getHttpMethodTextColor(method))}>GET</span>
          <Input type="text" value={value} onChange={e => setValue(e.target.value)} className="flex-grow w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0" />
        </div>
        <div className="flex items-center space-x-2 p-2">
          <Button size="sm" type="button" className="bg-gray-500 text-white">Send</Button>
        </div>
      </form>
    </div>

  )
}

const KeyValueInput = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-0 rounded bg-muted px-1 py-2">
        <Checkbox className="mr-1" />
        <Input type="text" placeholder="name" className="w-24 bg-transparent shadow-none px-2 py-0 text-sm border-none" />
        <Input type="text" placeholder="value" className="flex-grow bg-transparent shadow-none px-2 py-0 text-sm border-none" />
      </div>
      {/* Add more parameter rows as needed */}
    </div>
  )
}

function RequestMeta() {
  return (
    <div className="w-1/4 min-w-[300px] border-r-2 border-muted p-4">
      <Tabs defaultValue="params">
        <div className="flex items-center justify-start">
          <TabsList>
            <TabsTrigger value="params" className="text-sm font-medium">Params</TabsTrigger>
            <TabsTrigger value="headers" className="text-sm font-medium">Headers</TabsTrigger>
            <TabsTrigger value="body" className="text-sm font-medium">Body</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="params">
          <KeyValueInput />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueInput />
        </TabsContent>
        <TabsContent value="body">
          <Editor height="400px" defaultLanguage="json" defaultValue="{}" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ResponseDetails() {
  return (
    <div className="flex-grow flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-medium">Response</div>
      </div>
      <div className="flex-grow flex items-center justify-center text-gray-400">
        <span>🌀 Connection refused</span>
      </div>
    </div>
  )
}

function getHttpMethodTextColor(method: string) {
  return {
    GET: 'text-green-500',
    POST: 'text-yellow-500',
    PUT: 'text-orange-500',
    PATCH: 'text-orange-500',
    DELETE: 'text-red-500',
    OPTIONS: 'text-blue-300',
  }[method]
}