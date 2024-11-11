import { RoutesMonitor } from "./RoutesMonitor";

// export type Monitoring = {
//   /**
//    * Internal utilities used for monitoring
//    */
//   internals: {
//     fileWatcher: FileWatcher;
//     findHonoRoutes: () => ReturnType<typeof extractRouteTrees>;
//   },
//   /**
//    *
//    * @returns a factory that can be used to get a mock hono app
//    */
//   createFactory: () => AppFactory;
//   teardown: () => void;
// }
export function createRoutesMonitor(projectRoot: string) {
  return new RoutesMonitor(projectRoot);
  // const ts: TsType = getTsLib(projectRoot);

  // Only watch the src directory (if it exists)
  // const possibleLocation = path.resolve(path.join(projectRoot, "src"));
  // const location = ts.sys.directoryExists(possibleLocation)
  //   ? possibleLocation
  //   : projectRoot;
  // const fileWatcher = new FileWatcher(location);

  // // const findHonoRoutes = () => extractRouteTrees(service, ts, projectRoot)
  // return {
  //   internals: {
  //     watcher: fileWatcher,
  //     findHonoRoutes,
  //   },
  //   createFactory: () => {
  //     const result = findHonoRoutes();
  //     if (result.errorCount) {
  //       console.warn(`${result.errorCount} error(s) found while analyzing routes`);
  //     }

  //     // Find root route
  //     const root = analyze(result.resourceManager.getResources());

  //     if (!root) {
  //       throw new Error("No root route found");
  //     }

  //     const factory = new AppFactory(result.resourceManager);
  //     factory.rootId = root.id;
  //     return factory;
  //   },
  //   teardown: () => {
  //     fileWatcher.teardown();
  //     service.dispose();
  //   },
  // };
}
