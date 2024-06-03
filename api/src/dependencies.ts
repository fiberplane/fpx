type Dependency = {
  name: string;
  version: string;
  repository: {
    owner: string;
    repo: string;
    url: string;
  };
};

export function getProjectDependencies() {
  // pretend that this fetches and parses the package.json
  // TODO: actually fetch and parse package.json
  const data: Dependency[] = [
    {
      name: "hono",
      version: "4.3.11",
      repository: {
        owner: "honojs",
        repo: "hono",
        url: "https://github.com/honojs/hono",
      },
    },
    {
      name: "@neondatabase/serverless",
      version: "0.9.3",
      repository: {
        owner: "neondatabase",
        repo: "serverless",
        url: "https://github.com/neondatabase/serverless",
      },
    },
    // {
    //   name: "drizzle-orm",
    //   version: "0.30.10",
    //   repository: {
    //     owner: "drizzle-team",
    //     repo: "drizzle-orm",
    //     url: "https://github.com/drizzle-team/drizzle-orm",
    //   },
    // },
  ];

  return data;
}
