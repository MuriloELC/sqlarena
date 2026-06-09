import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { AuthProvider } from "./features/auth/AuthProvider";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
