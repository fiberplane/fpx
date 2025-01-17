import { createFileRoute } from "@tanstack/react-router";

// Define the route using createFileRoute with the correct path
export const Route = createFileRoute("/tester")({
  component: Tester,
});

function Tester() {
  return (
    <div>
      <h1>Tester Route</h1>
      <p>This is the tester route.</p>
    </div>
  );
}
