import Pixel from "../components/Pixel.jsx";
import SectionHead from "../components/SectionHead.jsx";
import { research } from "../data/research.js";

export default function Research() {
  return (
    <section id="research" className="block" aria-label="Research">
      <SectionHead n="02" title="research" />

      {research.map((r, i) => (
        <article key={r.id} id={r.id} className="area" aria-label={r.name}>
          <div className="area-side px-host">
            <span className="mono-n">{String(i + 1).padStart(2, "0")}</span>
            <Pixel glyph={r.glyph} size={54} spread={1.3} />
            <h3>{r.name}</h3>
            {r.items.length > 1 && (
              <p className="area-count">
                {r.items.length} projects · scroll ↓
              </p>
            )}
          </div>
          <ul className="area-items" tabIndex={0} aria-label={`${r.name} projects`}>
            {r.items.map((it) => (
              <li key={it.title}>
                <h4>
                  {it.href ? (
                    <a href={it.href} target="_blank" rel="noreferrer">
                      {it.title} ↗
                    </a>
                  ) : (
                    it.title
                  )}
                </h4>
                <p>{it.text}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
