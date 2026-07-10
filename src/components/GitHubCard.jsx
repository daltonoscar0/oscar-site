import { useState, useEffect } from "react";
import { site } from "../config.js";

const USER = site.github.username;

function relativeTime(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function GitHubCard() {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Prefer the latest push event (has the commit message)…
        const res = await fetch(
          `https://api.github.com/users/${USER}/events/public?per_page=30`
        );
        if (res.ok) {
          const events = await res.json();
          const push = events.find(
            (e) => e.type === "PushEvent" && e.payload?.commits?.length
          );
          if (push && !cancelled) {
            const commit = push.payload.commits[push.payload.commits.length - 1];
            setActivity({
              repo: push.repo.name.replace(`${USER}/`, ""),
              message: commit.message.split("\n")[0],
              when: push.created_at,
              href: `https://github.com/${push.repo.name}`,
            });
            return;
          }
        }
        // …otherwise fall back to the most recently pushed repo.
        const repoRes = await fetch(
          `https://api.github.com/users/${USER}/repos?sort=pushed&per_page=1`
        );
        if (!repoRes.ok) throw new Error("github unavailable");
        const [repo] = await repoRes.json();
        if (repo && !cancelled) {
          setActivity({
            repo: repo.name,
            message: repo.description || "last pushed to this repo",
            when: repo.pushed_at,
            href: repo.html_url,
          });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h2 className="section-label">Latest on GitHub</h2>
      {error ? (
        <div className="card card-empty">
          GitHub is rate-limiting right now — try again in a minute, or visit{" "}
          <a href={`https://github.com/${USER}`} style={{ textDecoration: "underline" }}>
            github.com/{USER}
          </a>
          .
        </div>
      ) : !activity ? (
        <div className="card card-empty">Fetching latest commit…</div>
      ) : (
        <a className="card" href={activity.href} target="_blank" rel="noreferrer">
          <div className="card-row">
            <span className="card-title">{activity.repo}</span>
            <span className="card-meta">{relativeTime(activity.when)}</span>
          </div>
          <p className="card-body">{activity.message}</p>
        </a>
      )}
    </section>
  );
}
