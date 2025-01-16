import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";

export const Route = createFileRoute("/workflow")({
  component: WorkflowLayout,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(workflowsQueryOptions());
    return { workflows: response.data };
  }
});

function WorkflowLayout() {
  const { workflows } = Route.useLoaderData();

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="grid grid-cols-[300px_1fr] min-h-full">
        <WorkflowSidebar workflows={workflows} />

        {/* Main Content */}
        <div className="grid grid-rows-[auto_1fr] h-screen overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  );
}
