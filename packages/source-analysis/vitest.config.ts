import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // // Run tests with profiling enabled
    // pool: 'forks',
    // poolOptions: {
    //   forks: {
    //     execArgv: [
    //       '--cpu-prof',
    //       '--cpu-prof-dir=test-runner-profile',
    //       '--heap-prof',
    //       '--heap-prof-dir=test-runner-profile'
    //     ],
    //     // To generate a single profile
    //     singleFork: true,
    //   },
    // },
  },
});
