import { createFileRoute } from "@tanstack/react-router";
import { Playground } from "@/components/playground";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Playground />
  );
}
