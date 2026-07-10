import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

export default function Nav() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const links = [
    { to: "/", label: "home" },
    { to: "/about", label: "about" },
    { to: "/projects", label: "projects" },
    { to: "/contact", label: "contact" },
  ];

  return (
    <nav className="nav">
      <div className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <button
        className="theme-toggle"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </nav>
  );
}
