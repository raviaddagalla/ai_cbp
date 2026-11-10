// main.tsx — Application entry point
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Register the Service Worker for PWA offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("[SignBridge] Service Worker registered"))
      .catch((err) => console.warn("[SignBridge] SW registration failed:", err));
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
