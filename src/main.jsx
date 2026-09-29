import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

// Keep Railway backend alive — ping every 4 minutes
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:3000";
const pingBackend = () => {
  fetch(`${BACKEND}/health`, { method: "GET" }).catch(() => {});
};
pingBackend(); // ping immediately on load
setInterval(pingBackend, 4 * 60 * 1000); // then every 4 minutes

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
     <App />
    </BrowserRouter>
  </StrictMode>
);
