import { ApiKeyList } from "./ApiKeyList";
import { DashboardHeader } from "./dashboard-header";
import { ProjectList } from "./project-list";

export function DashboardPage() {
  return (
    <div className="container mx-auto py-4">
      <DashboardHeader />
      <div className="grid gap-10">
        <ApiKeyList />
        <ProjectList />
      </div>
    </div>
  );
}
