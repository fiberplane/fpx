import { ApiKeyList } from "./ApiKeyList";
import { ProjectList } from "./ProjectList/ProjectList";

export function DashboardPage() {
  return (
    <div className="container max-w-screen-lg mx-auto py-4">
      <div className="grid gap-10">
        <ApiKeyList />
        <ProjectList />
      </div>
    </div>
  );
}
