import { Layout } from "@/Layout";
import { RequestorPage } from "@/garbage/RequestorPage";
import { createFileRoute } from "@tanstack/react-router";
import { Playground } from "@/components/playground";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Layout>
      <RequestorPage />
    </Layout>
  );
}
