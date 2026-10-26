import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

/** Shows a recovery screen instead of a blank page if rendering ever throws. */
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: "Nunito, sans-serif", color: "#1a3a4f", textAlign: "center", padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Oops, Pip hit an iceberg!</h1>
        <p style={{ margin: 0, color: "#5b7a8f" }}>Something went wrong. Your progress is saved.</p>
        <button onClick={() => window.location.reload()} style={{ padding: "11px 22px", borderRadius: 14, background: "linear-gradient(135deg,#7eadd8,#5baed4)", border: "none", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Reload
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
