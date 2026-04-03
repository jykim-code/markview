import { createRoot } from "react-dom/client";
import { ExtensionApp } from "./components/ExtensionApp";
import "./styles/globals.css";

try {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(<ExtensionApp />);
  } else {
    document.body.innerHTML = "<pre>Error: #root not found</pre>";
  }
} catch (err) {
  document.body.innerHTML = `<pre style="color:red;padding:16px;white-space:pre-wrap;">INIT ERROR:\n${err}\n\n${err instanceof Error ? err.stack : ""}</pre>`;
}

// Catch unhandled errors and show on page
window.addEventListener("error", (e) => {
  const div = document.createElement("pre");
  div.style.cssText = "color:red;padding:16px;white-space:pre-wrap;font-size:12px;";
  div.textContent = `RUNTIME ERROR:\n${e.message}\n${e.filename}:${e.lineno}`;
  document.body.prepend(div);
});

window.addEventListener("unhandledrejection", (e) => {
  const div = document.createElement("pre");
  div.style.cssText = "color:orange;padding:16px;white-space:pre-wrap;font-size:12px;";
  div.textContent = `UNHANDLED PROMISE:\n${e.reason}`;
  document.body.prepend(div);
});
