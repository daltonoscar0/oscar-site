import { useState, useEffect, useMemo } from "react";
import { site } from "../config.js";
import { writings, papers } from "../data/works.js";

const USER = site.github.username;

export default function Projects() {
  const [repos, setRepos] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setRepos(
          data
            .filter((r) => !r.fork)
            .map((r) => ({
              title: r.name,
              description: r.description || "",
              href: r.html_url,
              date: r.language || "",
              tags: ["GitHub project"],
            }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => [...repos, ...writings, ...papers],
    [repos]
  );

  const visible =
    filter === "All" ? items : items.filter((i) => i.tags.includes(filter));

  return (
    <>
      <h1 className="page-title">projects</h1>

      <div className="filter-row" role="group" aria-label="Filter projects by tag">
        {["All", ...site.tags].map((t) => (
          <button
            key={t}
            className={`chip${filter === t ? " active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          Nothing under this tag yet — check back soon.
        </p>
      ) : (
        <div className="project-grid">
          {visible.map((item) => (
            <a
              key={item.href}
              className="project-card"
              href={item.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className="card-row">
                <span className="card-title">{item.title}</span>
                {item.date && <span className="card-meta">{item.date}</span>}
              </div>
              {item.description && (
                <p className="card-body">{item.description}</p>
              )}
              <div className="project-tags">
                {item.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
