import { FunctionTool, ReActAgent } from "llamaindex";

// Import `shared` module to allow for tool calls on the configured LLM
import "./shared";

const sumNumbers = ({ a, b }: { a: number; b: number }) => {
  return `${a + b}`;
};
const tool = FunctionTool.from(sumNumbers, {
  name: "sumNumbers",
  description: "Use this function to sum two numbers",
  parameters: {
    type: "object",
    properties: {
      a: {
        type: "number",
        description: "First number to sum",
      },
      b: {
        type: "number",
        description: "Second number to sum",
      },
    },
    required: ["a", "b"],
  },
});

const tools = [tool];

// NOTE - This does not work with llama3.1 locally
export async function testAgent() {
  const agent = new ReActAgent({
    tools,
  });

  const response = await agent.chat({
    message: "Add 101 and 303",
  });

  console.log(response);
}
