import { useState, useEffect } from "react";
import { site } from "../config.js";

const { username, apiKey } = site.lastfm;
const POLL_MS = 60_000;

export default function RecentlyPlayed() {
  const [tracks, setTracks] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    async function load() {
      try {
        const url =
          `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks` +
          `&user=${encodeURIComponent(username)}&api_key=${apiKey}` +
          `&format=json&limit=3`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("lastfm unavailable");
        const data = await res.json();
        const list = data?.recenttracks?.track;
        if (!cancelled && Array.isArray(list)) {
          setTracks(
            list.map((t) => ({
              name: t.name,
              artist: t.artist?.["#text"] || "",
              art: t.image?.find((i) => i.size === "medium")?.["#text"] || "",
              href: t.url,
              nowPlaying: t["@attr"]?.nowplaying === "true",
            }))
          );
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="live">
      <p className="live-label">recently played</p>

      {!apiKey ? (
        <div className="card card-empty">
          No Last.fm key set in <code>src/config.js</code>.
        </div>
      ) : error ? (
        <div className="card card-empty">
          Last.fm isn’t answering right now.
        </div>
      ) : !tracks ? (
        <div className="card card-empty">loading…</div>
      ) : tracks.length === 0 ? (
        <div className="card card-empty">
          nothing yet.
        </div>
      ) : (
        <div className="card" style={{ display: "grid", gap: 14 }}>
          {tracks.map((t, i) => (
            <a key={`${t.href}-${i}`} className="track" href={t.href} target="_blank" rel="noreferrer">
              {t.art ? (
                <img className="track-art" src={t.art} alt="" loading="lazy" />
              ) : (
                <div className="track-art" aria-hidden="true" />
              )}
              <div className="track-info">
                <div className="track-name">
                  {t.nowPlaying && <span className="live-dot" aria-label="now playing" />}
                  <span className="clip">{t.name}</span>
                </div>
                <div className="track-artist">{t.artist}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
