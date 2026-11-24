import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Pixel from "../components/Pixel.jsx";
import { site } from "../config.js";

// Commits come from GitHub's commit search (public repos, default
// branches, newest first, 100 per page, 1000 max). Pages and per-commit
// details are cached in sessionStorage so scrolling back is free.
const USER = site.github.username;
const PER_PAGE = 100;
const MAX_RESULTS = 1000;
const CACHE_MS = 10 * 60 * 1000;
const WEEKS = 16;
const AUTO_PAGES = 2; // pages fetched before the reader scrolls

const API = "https://api.github.com";
const HEADERS = { Accept: "application/vnd.github+json" };

function cached(key) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(key));
    if (hit && Date.now() - hit.t < CACHE_MS) return hit.v;
  } catch {}
  return null;
}
function store(key, v) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
  } catch {}
}

class RateLimited extends Error {
  constructor(reset) {
    super("rate limited");
    this.reset = reset;
  }
}

async function getJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
    throw new RateLimited(reset || Date.now() + 60_000);
  }
  if (!res.ok) throw new Error(`GitHub said ${res.status}`);
  return res.json();
}

async function fetchPage(page) {
  const key = `commits:${USER}:${page}`;
  const hit = cached(key);
  if (hit) return hit;
  const q = encodeURIComponent(`author:${USER}`);
  const data = await getJSON(
    `${API}/search/commits?q=${q}&sort=author-date&order=desc&per_page=${PER_PAGE}&page=${page}`,
  );
  const v = {
    total: data.total_count,
    items: data.items.map((it) => {
      const [title, ...rest] = it.commit.message.split("\n");
      return {
        sha: it.sha,
        repo: it.repository.full_name,
        repoShort: it.repository.name,
        title,
        body: rest.join("\n").trim(),
        date: it.commit.author.date,
        comments: it.commit.comment_count,
        url: it.html_url,
        treeUrl: `https://github.com/${it.repository.full_name}/tree/${it.sha}`,
      };
    }),
  };
  store(key, v);
  return v;
}

async function fetchDetail(repo, sha) {
  const key = `commit:${repo}:${sha}`;
  const hit = cached(key);
  if (hit) return hit;
  const d = await getJSON(`${API}/repos/${repo}/commits/${sha}`);
  const v = {
    additions: d.stats?.additions ?? 0,
    deletions: d.stats?.deletions ?? 0,
    files: (d.files || []).map((f) => ({
      name: f.filename,
      status: f.status,
      add: f.additions,
      del: f.deletions,
    })),
  };
  store(key, v);
  return v;
}

function useCommits() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const busy = useRef(false);

  const cap = total === null ? Infinity : Math.min(total, MAX_RESULTS);
  const done = exhausted || (total !== null && page * PER_PAGE >= cap);

  const loadMore = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = page + 1;
      const { total: t, items: got } = await fetchPage(next);
      setTotal(t);
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c.repo + c.sha));
        return [...prev, ...got.filter((c) => !seen.has(c.repo + c.sha))];
      });
      setPage(next);
      if (got.length < PER_PAGE) setExhausted(true);
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [page, done]);

  return { items, total, page, loading, error, done, loadMore };
}

/* formatting */

const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 864e5);
  if (dayKey(d) === dayKey(today)) return "today";
  if (dayKey(d) === dayKey(yest)) return "yesterday";
  const opts = { weekday: "short", day: "numeric", month: "short" };
  if (d.getFullYear() !== today.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts).replace(/,/g, "").toLowerCase();
}
const timeLabel = (iso) =>
  new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();

/* activity strip */

function Activity({ items, covered }) {
  const { cells, max } = useMemo(() => {
    const counts = new Map();
    for (const c of items)
      counts.set(dayKey(c.date), (counts.get(dayKey(c.date)) || 0) + 1);
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    const cells = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      cells.push({
        key: dayKey(d),
        date: new Date(d),
        n: counts.get(dayKey(d)) || 0,
      });
    }
    return { cells, max: Math.max(1, ...cells.map((c) => c.n)) };
  }, [items]);

  return (
    <figure
      className="activity"
      aria-label={`Commits per day over the last ${WEEKS} weeks`}
    >
      <div className="activity-grid">
        {cells.map((c) => (
          <span
            key={c.key}
            className="activity-cell"
            data-level={c.n === 0 ? 0 : Math.ceil((c.n / max) * 4)}
            title={`${c.n} commit${c.n === 1 ? "" : "s"} · ${c.date.toDateString()}`}
          />
        ))}
      </div>
      <figcaption>
        <span>last {WEEKS} weeks</span>
        {!covered && <span>· filling in as older pages load</span>}
        <span className="activity-key" aria-hidden="true">
          less <i data-level="0" />
          <i data-level="1" />
          <i data-level="2" />
          <i data-level="3" />
          <i data-level="4" /> more
        </span>
      </figcaption>
    </figure>
  );
}

/* one commit */

function CommitRow({ c }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailErr, setDetailErr] = useState(null);

  useEffect(() => {
    if (!open || detail || detailErr) return;
    fetchDetail(c.repo, c.sha).then(setDetail, setDetailErr);
  }, [open, detail, detailErr, c.repo, c.sha]);

  const files = detail?.files || [];
  return (
    <li className={`commit${open ? " open" : ""}`}>
      <button
        className="commit-head px-host"
        aria-expanded={open}
        onClick={() => {
          setMounted(true);
          setOpen((o) => !o);
        }}
      >
        <span className="commit-mark">
          <Pixel glyph="dot" size={8} spread={2.4} />
        </span>
        <span className="commit-title">{c.title}</span>
        <span className="commit-repo">{c.repoShort}</span>
        <span className="commit-sha">{c.sha.slice(0, 7)}</span>
        <span className="commit-time">{timeLabel(c.date)}</span>
        <span className="commit-caret" aria-hidden="true" />
      </button>

      <div className="commit-panel" aria-hidden={!open}>
        {mounted && (
          <div className="commit-panel-inner">
            {c.body ? (
              <p className="commit-body">{c.body}</p>
            ) : (
              <p className="commit-body commit-quiet">no description.</p>
            )}

            <dl className="commit-facts">
              <div>
                <dt>repo</dt>
                <dd>{c.repo}</dd>
              </div>
              <div>
                <dt>sha</dt>
                <dd className="mono">{c.sha}</dd>
              </div>
              <div>
                <dt>comments</dt>
                <dd>{c.comments}</dd>
              </div>
              <div>
                <dt>changes</dt>
                <dd>
                  {detail ? (
                    <>
                      <span className="add">+{detail.additions}</span>{" "}
                      <span className="del">−{detail.deletions}</span> in{" "}
                      {files.length} file
                      {files.length === 1 ? "" : "s"}
                    </>
                  ) : detailErr ? (
                    <span className="commit-quiet">unavailable right now</span>
                  ) : (
                    <span className="commit-quiet">loading…</span>
                  )}
                </dd>
              </div>
            </dl>

            {files.length > 0 && (
              <ul className="commit-files">
                {files.slice(0, 12).map((f) => (
                  <li key={f.name}>
                    <span className={`fstat fstat-${f.status}`}>
                      {f.status[0]}
                    </span>
                    <span className="fname">{f.name}</span>
                    <span className="add">+{f.add}</span>
                    <span className="del">−{f.del}</span>
                  </li>
                ))}
                {files.length > 12 && (
                  <li className="commit-quiet">+ {files.length - 12} more</li>
                )}
              </ul>
            )}

            <div className="commit-links">
              <a
                className="btn btn-small px-host"
                href={c.url}
                target="_blank"
                rel="noreferrer"
              >
                view on github <Pixel glyph="arrow" size={12} spread={0.6} />
              </a>
              <a
                className="side-link"
                href={c.treeUrl}
                target="_blank"
                rel="noreferrer"
              >
                browse files at this commit ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/* feed: shared by the home-page section (boxed) and the full page */

function CommitFeed({ boxed = false, n = "04", headingLevel = "h2" }) {
  const { items, total, page, loading, error, done, loadMore } = useCommits();
  const [query, setQuery] = useState("");
  const [repo, setRepo] = useState("all");
  const [started, setStarted] = useState(!boxed);
  const wrap = useRef(null);
  const box = useRef(null);
  const sentinel = useRef(null);

  // On the home page, wait until the section is close before calling GitHub.
  useEffect(() => {
    if (started || !wrap.current) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStarted(true),
      { rootMargin: "800px 0px" },
    );
    obs.observe(wrap.current);
    return () => obs.disconnect();
  }, [started]);

  // First page, plus one more if the activity strip needs it.
  const oldest = items.length ? new Date(items[items.length - 1].date) : null;
  const covered = done || (oldest && Date.now() - oldest > WEEKS * 7 * 864e5);
  useEffect(() => {
    if (!started || loading || error) return;
    if (page === 0 || (!covered && page < AUTO_PAGES)) loadMore();
  }, [started, loading, error, covered, page, loadMore]);

  // Endless scroll: load the next page when the sentinel gets close.
  // Boxed, it watches the box's own scroll; otherwise the window's.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !started) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !loading && !error && !done) loadMore();
      },
      { root: boxed ? box.current : null, rootMargin: boxed ? "400px 0px" : "900px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started, boxed, loading, error, done, loadMore]);

  const repos = useMemo(() => {
    const m = new Map();
    for (const c of items) m.set(c.repoShort, (m.get(c.repoShort) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (c) =>
        (repo === "all" || c.repoShort === repo) &&
        (!q ||
          (c.title + " " + c.body + " " + c.repoShort)
            .toLowerCase()
            .includes(q)),
    );
  }, [items, query, repo]);

  const days = useMemo(() => {
    const out = [];
    for (const c of shown) {
      const k = dayKey(c.date);
      if (!out.length || out[out.length - 1].key !== k)
        out.push({ key: k, date: c.date, list: [] });
      out[out.length - 1].list.push(c);
    }
    return out;
  }, [shown]);

  const filtering = query.trim() || repo !== "all";
  const Title = headingLevel;

  return (
    <div ref={wrap} className={`feed${boxed ? " feed-boxed" : ""}`}>
      <header className="commits-head">
        <div className="shead">
          <span className="shead-n">{n}</span>
          <Title className="shead-title">commits</Title>
          <div className="shead-side">
            {boxed ? (
              <Link to="/commits" className="side-link px-host">
                full page <Pixel glyph="arrow" size={12} spread={0.6} />
              </Link>
            ) : (
              <a
                href={`https://github.com/${USER}`}
                target="_blank"
                rel="noreferrer"
                className="side-link"
              >
                github.com/{USER} ↗
              </a>
            )}
          </div>
        </div>
        <div className="commits-stats">
          <div>
            <span className="stat-n">{total ?? "…"}</span>
            <span className="label">commits</span>
          </div>
          <div>
            <span className="stat-n">{repos.length || "…"}</span>
            <span className="label">repos so far</span>
          </div>
          <div>
            <span className="stat-n">{items.length}</span>
            <span className="label">loaded</span>
          </div>
        </div>
        <Activity items={items} covered={covered} />
      </header>

      <div className="commits-tools">
        <label className="search">
          <span className="sr-only">Filter commits</span>
          <Pixel glyph="research" size={14} />
          <input
            type="search"
            placeholder="filter by message or repo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="select">
          <span className="sr-only">Repository</span>
          <select value={repo} onChange={(e) => setRepo(e.target.value)}>
            <option value="all">all repos</option>
            {repos.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtering && (
        <p className="commits-note">
          {shown.length} of {items.length} loaded commits match. Scrolling keeps
          loading older ones.
        </p>
      )}

      <div ref={box} className={boxed ? "commit-box" : undefined}>
        <ol className="days">
          {days.map((d) => (
            <li key={d.key} className="day">
              <h3 className="day-head">
                <span>{dayLabel(d.date)}</span>
                <span>{d.list.length}</span>
              </h3>
              <ul className="commit-list">
                {d.list.map((c) => (
                  <CommitRow key={c.repo + c.sha} c={c} />
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <div ref={sentinel} className="commits-end" aria-live="polite">
          {error instanceof RateLimited ? (
            <>
              <p>
                GitHub’s rate limit kicked in. It resets at{" "}
                {timeLabel(new Date(error.reset).toISOString())}.
              </p>
              <button className="btn btn-ghost" onClick={loadMore}>
                try again
              </button>
            </>
          ) : error ? (
            <>
              <p>Couldn’t reach GitHub ({error.message}).</p>
              <button className="btn btn-ghost" onClick={loadMore}>
                try again
              </button>
            </>
          ) : done ? (
            <p>
              <Pixel glyph="commits" size={22} /> that’s all {items.length}
              {total > MAX_RESULTS
                ? ` (GitHub search stops at ${MAX_RESULTS})`
                : ""}
              .
            </p>
          ) : (
            <div className="loader" aria-label="Loading older commits">
              <Pixel glyph="projects" size={22} pulse={700} spread={1.4} />
              <span>{started ? "loading older commits" : "waiting to load"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Section 05 on the home page: same feed, list scrolls inside its own box.
export function CommitsSection() {
  return (
    <section id="commits" className="block" aria-label="Commits">
      <CommitFeed boxed />
    </section>
  );
}

// /commits: the whole page scrolls.
export default function Commits() {
  useEffect(() => {
    document.title = "commits · Oscar Dalton";
    window.scrollTo(0, 0);
    return () => {
      document.title = "Oscar Dalton";
    };
  }, []);

  return (
    <main className="commits-page">
      <CommitFeed headingLevel="h1" />
    </main>
  );
}
