import { BrowserRouter as Router } from "react-router-dom";
import { Button } from "./components/ui/button";

export function App() {
  return (
    <Router>
      <Button>I am a Button</Button>
    </Router>
  );
}

export default App;
