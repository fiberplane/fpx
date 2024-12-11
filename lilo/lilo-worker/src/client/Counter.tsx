import { useState } from "hono/jsx";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)} type="button">
        Increase count
      </button>
      <span>Count: {count}</span>
    </div>
  );
}