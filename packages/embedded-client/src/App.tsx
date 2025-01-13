import { useState } from "react";

export function App() {
  const [counter, setCounter] = useState(0);
  const increment = () => setCounter((current) => current + 1);
  const decrement = () => setCounter((current) => current - 1);

  return (
    <div>
      <button type="button" onClick={decrement}>
        -
      </button>
      <strong>{counter}</strong>
      <button type="button" onClick={increment}>
        +
      </button>
    </div>
  );
}
