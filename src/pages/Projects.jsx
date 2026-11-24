import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Pixel from "../components/Pixel.jsx";
import SectionHead from "../components/SectionHead.jsx";
import { site } from "../config.js";
import { writings, papers } from "../data/works.js";

const USER = site.github.username;
const LIMIT = 10;
const ROTATE = 10; // featured cycles through the 10 most recently pushed repos
const CACHE = "repos-v1";

// One step per page load: 0 on the first visit, then 1, 2, ... wrapping.
// Read at module load so React StrictMode's double render can't advance it twice.
const VISIT = (() => {
  try {
    const n = Number(localStorage.getItem("featured-visit") || -1) + 1;
    localStorage.setItem("featured-visit", String(n));
    return n;
  } catch {
    return 0;
  }
})();

function readCache() {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE)) || [];
  } catch {
    return [];
  }
}

function ago(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "today";
  if (d < 2) return "yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function Projects() {
  const [repos, setRepos] = useState(readCache);
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const list = data
          .filter((r) => !r.fork)
          .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
          .map((r) => ({
            title: r.name,
            description: r.description || "",
            href: r.html_url,
            date: r.language || "",
            pushed: r.pushed_at,
            tags: ["GitHub project"],
          }));
        setRepos(list);
        try {
          sessionStorage.setItem(CACHE, JSON.stringify(list));
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => [...papers, ...writings, ...repos], [repos]);
  // Most recently pushed repo first, then the next most recent on each refresh.
  const pool = repos.slice(0, ROTATE);
  const slot = pool.length ? VISIT % pool.length : -1;
  const featured = slot >= 0 ? pool[slot] : papers[0];

  const counts = useMemo(() => {
    const c = { All: items.length };
    for (const t of site.tags) c[t] = items.filter((i) => i.tags.includes(t)).length;
    return c;
  }, [items]);

  // The featured item already sits above the list, so skip it under "all".
  const filtered =
    filter === "All"
      ? items.filter((i) => i !== featured)
      : items.filter((i) => i.tags.includes(filter));
  const visible = showAll ? filtered : filtered.slice(0, LIMIT);

  return (
    <section id="projects" className="block" aria-label="Projects">
      <SectionHead n="05" title="projects">
        <Link to="/commits" className="px-host side-link">
          every commit <Pixel glyph="arrow" size={12} spread={0.6} />
        </Link>
      </SectionHead>

      {featured && (
        <a key={featured.href} className="featured px-host" href={featured.href} target="_blank" rel="noreferrer">
          <Pixel glyph={featured.pushed ? "commits" : "lm"} size={84} spread={1.6} />
          <div>
            <p className="label">
              {featured.pushed
                ? `${slot === 0 ? "latest commit" : `${ordinal(slot + 1)} most recent`} · ${ago(featured.pushed)}${featured.date ? ` · ${featured.date.toLowerCase()}` : ""}`
                : `paper · ${featured.date}`}
            </p>
            <h3>{featured.title}</h3>
            {featured.description && <p className="featured-desc">{featured.description}</p>}
            <span className="readmore">{featured.pushed ? "github ↗" : "pdf ↗"}</span>
          </div>
        </a>
      )}

      <div className="chips" role="group" aria-label="Filter projects">
        {["All", ...site.tags].map((t) => (
          <button
            key={t}
            className={`chip${filter === t ? " active" : ""}`}
            aria-pressed={filter === t}
            onClick={() => {
              setFilter(t);
              setShowAll(false);
            }}
          >
            {label(t)} <span className="chip-count">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty">nothing here yet.</p>
      ) : (
        <ul className="list">
          {visible.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer" className="px-host">
                <Pixel glyph="dot" size={8} spread={2} />
                <span className="list-main">
                  <span className="list-title">{item.title}</span>
                  {item.description && (
                    <span className="list-desc">{item.description}</span>
                  )}
                </span>
                <span className="list-meta">{item.date}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {!showAll && filtered.length > LIMIT && (
        <button className="btn btn-ghost" onClick={() => setShowAll(true)}>
          show all {filtered.length}
        </button>
      )}
    </section>
  );
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function label(t) {
  return { All: "all", "GitHub project": "code", "academic paper": "papers" }[t] || t;
}
