import { Layout } from "@/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/traces")({
  component: TracesLayout,
});

function TracesLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Layout>
        <Outlet />
      </Layout>
    </ThemeProvider>
  );
}
