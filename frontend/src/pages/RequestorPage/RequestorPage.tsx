import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { RequestMethodCombobox } from "./RequestMethodCombobox";

type ProbedRoute = {
  path: string;
  method: string;
  handler: string;
};

// TODO - Mock Routes

export const RequestorPage = ({ routes } : { routes: ProbedRoute[] }) => {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 text-gray-700 flex flex-col p-4">
        <div className="text-lg font-semibold mb-4">Routes</div>
        <div className="flex-grow">
          <div className="text-sm font-medium mb-2">Detected</div>
          <div className="text-sm font-normal text-gray-500">GET localhost:8787</div>
        </div>
        <div className="mt-auto">
          Settings?
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <div className="flex items-center space-x-2">
            {/* <RequestMethodCombobox /> */}
            <span className="bg-green-500 text-white px-2 py-1 rounded">GET</span>
            <input type="text" defaultValue="http://localhost:8787/" className="w-full bg-transparent border-none focus:ring-0" />
          </div>
          <button className="bg-green-500 text-white px-4 py-2 rounded">Send</button>
        </div>
        {/* Body */}
        <div className="flex flex-grow">
          {/* Left Section */}
          <div className="w-1/4 min-w-[300px] border-r border-gray-300 p-4">
            <Tabs defaultValue="all">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="params" className="text-sm font-medium mb-2">Params</TabsTrigger>
                  <TabsTrigger value="headers" className="text-sm font-medium mb-2">Headers</TabsTrigger>
                  <TabsTrigger value="auth" className="text-sm font-medium mb-2">Auth</TabsTrigger>
                  <TabsTrigger value="body" className="text-sm font-medium mb-2">Body</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="params">
                Params
              </TabsContent>
              <TabsContent value="headers">
                Headers
              </TabsContent>
              <TabsContent value="auth">
                Auth
              </TabsContent>
              <TabsContent value="body">
                Body
              </TabsContent>
            </Tabs>
          </div>
          {/* Right Section */}
          <div className="flex-grow flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-medium">Response</div>
            </div>
            <div className="flex-grow flex items-center justify-center text-gray-400">
              <span>🌀 Connection refused</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestorPage;
