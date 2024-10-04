import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from '@clerk/clerk-react'

const root = document.getElementById("root");
if (!root) {
  throw new Error("Application failed to start: missing root element");
}

// Import your publishable key
// const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const PUBLISHABLE_KEY = "pk_test_bmV4dC1sb25naG9ybi0yMi5jbGVyay5hY2NvdW50cy5kZXYk";
// if (!PUBLISHABLE_KEY) {
//   throw new Error("Missing Publishable Key")
// }


ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>,
);
