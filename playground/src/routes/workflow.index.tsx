import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workflow/")({
  component: WorkflowOverview,
});

function WorkflowOverview() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-medium">
        Select a workflow to view details
      </h2>
    </div>
  );
}
