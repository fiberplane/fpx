import { Layout } from "@/Layout";
import { RequestorPage } from "@/garbage/RequestorPage";
import { createFileRoute } from "@tanstack/react-router";
import { Playground } from "@/components/playground";

export const Route = createFileRoute("/")({
  component: Index,
});

/**
 * The main page of the playground, a Fiberplane Studio-like interface for interacting with the API.
 */
function Index() {
  return (
    <Layout>
      <RequestorPage />
    </Layout>
  );
}
