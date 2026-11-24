import { useEffect, useState } from "react";
import { site } from "../config.js";

const { username } = site.letterboxd;
const profile = `https://letterboxd.com/${username}/`;
const LB = "https://letterboxd.com";

// Reads Letterboxd's RSS feed (served through the site's own /letterboxd.rss
// proxy, see vite.config.js) and shows the latest diary entries.
function parse(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const get = (el, tag) =>
    el.getElementsByTagNameNS(LB, tag)[0]?.textContent ||
    el.getElementsByTagName(`letterboxd:${tag}`)[0]?.textContent ||
    "";
  return [...doc.querySelectorAll("item")]
    .filter((it) => get(it, "filmTitle"))
    .map((it) => {
      const desc = it.querySelector("description")?.textContent || "";
      return {
        title: get(it, "filmTitle"),
        year: get(it, "filmYear"),
        rating: Number(get(it, "memberRating")) || 0,
        watched: get(it, "watchedDate"),
        rewatch: get(it, "rewatch") === "Yes",
        poster: desc.match(/<img[^>]+src="([^"]+)"/)?.[1] || "",
        href: it.querySelector("link")?.textContent || profile,
      };
    })
    .sort((a, b) => (b.watched || "").localeCompare(a.watched || ""))
    .slice(0, 3);
}

function stars(n) {
  if (!n) return "";
  return "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toLowerCase();
}

export default function RecentlyWatched() {
  const [films, setFilms] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    fetch("/letterboxd.rss")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then((xml) => {
        if (cancelled) return;
        const list = parse(xml);
        if (!list.length && !xml.includes("<rss")) throw new Error("not rss");
        setFilms(list);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="live">
      <p className="live-label">recently watched</p>
      {error ? (
        <a className="card card-empty" href={profile} target="_blank" rel="noreferrer">
          Letterboxd isn’t answering right now. See letterboxd.com/{username} ↗
        </a>
      ) : !films ? (
        <div className="card card-empty">loading…</div>
      ) : films.length === 0 ? (
        <a className="card card-empty" href={profile} target="_blank" rel="noreferrer">
          nothing logged yet.
        </a>
      ) : (
        <div className="card" style={{ display: "grid", gap: 14 }}>
          {films.map((f, i) => (
            <a key={`${f.href}-${i}`} className="track" href={f.href} target="_blank" rel="noreferrer">
              {f.poster ? (
                <img
                  className="track-art film-art"
                  src={f.poster}
                  alt=""
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
              ) : (
                <div className="track-art film-art" aria-hidden="true" />
              )}
              <div className="track-info">
                <div className="track-name">
                  <span className="clip">{f.title}</span>
                  {f.year && <span className="film-year">{f.year}</span>}
                </div>
                <div className="track-artist">
                  {stars(f.rating)}
                  {f.rating ? " · " : ""}
                  {f.rewatch ? "rewatched " : ""}
                  {shortDate(f.watched)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
