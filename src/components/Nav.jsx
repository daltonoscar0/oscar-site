import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Pixel from "./Pixel.jsx";

export const sections = [
  { id: "home", label: "home", glyph: "home" },
  { id: "about", label: "about", glyph: "about" },
  { id: "research", label: "research", glyph: "research" },
  { id: "now", label: "now", glyph: "now" },
  { id: "commits", label: "commits", glyph: "commits" },
  { id: "projects", label: "projects", glyph: "projects" },
  { id: "contact", label: "contact", glyph: "talk" },
];

// On the home page, scroll straight to the section even if the URL already
// has that hash (a plain hash link does nothing the second time).
export function jumpTo(e, id, pathname) {
  if (pathname !== "/") return;
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", id === "home" ? "/" : `/#${id}`);
}

export default function Nav() {
  const { pathname } = useLocation();
  const onCommits = pathname.startsWith("/commits");
  const [active, setActive] = useState("home");

  useEffect(() => {
    if (onCommits) return setActive("commits");
    // Current section = the lowest one whose top has passed 40% of the screen.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current = "home";
      let best = -Infinity;
      for (const s of sections) {
        if (s.route) continue;
        const top = document.getElementById(s.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line && top > best) {
          best = top;
          current = s.id;
        }
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [onCommits]);

  // On narrow screens the dock scrolls sideways; keep the active tab visible.
  useEffect(() => {
    const bar = document.querySelector(".dock-inner");
    const tab = bar?.querySelector("a.active");
    if (!bar || !tab) return;
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    if (left < bar.scrollLeft) bar.scrollTo({ left, behavior: "smooth" });
    else if (right > bar.scrollLeft + bar.clientWidth)
      bar.scrollTo({ left: right - bar.clientWidth, behavior: "smooth" });
  }, [active]);

  return (
    <nav className="dock" aria-label="Main navigation">
      <div className="dock-inner">
        {sections.map((s) => (
          <Link
            key={s.id}
            to={s.route || `/#${s.id}`}
            onClick={(e) => jumpTo(e, s.id, pathname)}
            className={`px-host${active === s.id ? " active" : ""}`}
            aria-current={active === s.id ? "location" : undefined}
          >
            <Pixel glyph={s.glyph} size={27} spread={0.8} eager />
            <span>{s.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
