import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// Always open at the top. The browser would otherwise restore the old
// scroll position on reload, or jump to a #section left in the address,
// so drop the hash (and old /about-style paths) and start at y = 0.
// /commits keeps its own path.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
{
  const old = ["/about", "/projects", "/books", "/contact"];
  const path = window.location.pathname.replace(/\/$/, "");
  if (window.location.hash || old.includes(path)) {
    window.history.replaceState(null, "", old.includes(path) ? "/" : window.location.pathname);
  }
  window.scrollTo(0, 0);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
