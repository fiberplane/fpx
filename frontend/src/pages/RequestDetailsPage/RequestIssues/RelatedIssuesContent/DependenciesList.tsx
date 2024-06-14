import { useDependencies } from "@/queries/queries";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export function DependenciesList() {
  const {
    data: dependencies,
    isLoading: isDependenciesLoading,
    isError: isDependenciesError,
  } = useDependencies();

  if (isDependenciesLoading) {
    return <div>Loading...</div>;
  }

  if (isDependenciesError) {
    return <div>Error loading dependencies</div>;
  }

  return (
    <ul>
      {dependencies?.map((dependency) => (
        <li key={dependency.name} className="block pb-2 last:pb-0">
          <a
            href={dependency.repository.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline flex gap-2
            items-center hover:text-blue-700 block"
          >
            <GitHubLogoIcon className="inline-block" /> {dependency.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
