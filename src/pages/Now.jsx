import Pixel from "../components/Pixel.jsx";
import SectionHead from "../components/SectionHead.jsx";
import RecentlyPlayed from "../components/RecentlyPlayed.jsx";
import RecentlyWatched from "../components/RecentlyWatched.jsx";
import BooksNote from "../components/BooksNote.jsx";
import now from "../data/now.json";

const glyphs = ["projects", "books", "research", "now"];

export default function Now() {
  return (
    <section id="now" className="block" aria-label="Now">
      <SectionHead n="03" title="now">
        fall 2026
      </SectionHead>

      <ol className="now-grid">
        {now.items.map((item, i) => (
          <li key={item.key} className="px-host">
            <div className="now-top">
              <span className="mono-n">{String(i + 1).padStart(2, "0")}</span>
              <Pixel glyph={glyphs[i % glyphs.length]} size={27} />
            </div>
            <h3>{item.key}</h3>
            {Array.isArray(item.value) ? (
              <ul>
                {item.value.map((v) =>
                  typeof v === "string" ? (
                    <li key={v}>{v}</li>
                  ) : (
                    <li key={v.code}>
                      {v.href ? (
                        <a className="course-code" href={v.href} target="_blank" rel="noreferrer">
                          {v.code}
                        </a>
                      ) : (
                        v.code
                      )}{" "}
                      {v.title}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>{item.value}</p>
            )}
          </li>
        ))}
      </ol>

      {now.took?.length > 0 && (
        <p className="took">
          <span className="label">took</span>
          {now.took.map((c) =>
            typeof c === "string" ? (
              <span key={c}>{c}</span>
            ) : (
              <a key={c.code} className="course-code" href={c.href} target="_blank" rel="noreferrer">
                {c.code}
              </a>
            )
          )}
        </p>
      )}

      <BooksNote />

      <div className="live-row">
        <RecentlyPlayed />
        <RecentlyWatched />
      </div>
    </section>
  );
}
