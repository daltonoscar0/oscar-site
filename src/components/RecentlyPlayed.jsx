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
    <section>
      <h2 className="section-label">Recently Played</h2>

      {!apiKey ? (
        <div className="card card-empty">
          Waiting on a Last.fm API key — paste it into{" "}
          <code>src/config.js</code> and this becomes a live feed of what
          Oscar's listening to on Spotify.
        </div>
      ) : error ? (
        <div className="card card-empty">
          Couldn't reach Last.fm right now — check back in a bit.
        </div>
      ) : !tracks ? (
        <div className="card card-empty">Tuning in…</div>
      ) : tracks.length === 0 ? (
        <div className="card card-empty">
          Nothing scrobbled yet — once Spotify plays start logging to
          Last.fm, they'll show up here.
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
                  {t.name}
                </div>
                <div className="track-artist">{t.artist}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
