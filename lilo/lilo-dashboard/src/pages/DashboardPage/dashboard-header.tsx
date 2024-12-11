import { UserNav } from "./user-nav";

export function DashboardHeader() {
  return (
    <header className="flex justify-between items-center mb-10">
      <h1 className="text-3xl font-bold">Lilo Dashboard</h1>
      <UserNav />
    </header>
  );
}
