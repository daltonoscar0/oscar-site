import Pixel from "../components/Pixel.jsx";
import { site } from "../config.js";
import { research } from "../data/research.js";

export default function Hero() {
  return (
    <section id="home" className="hero" aria-label={site.name}>
      <div className="hero-top">
        <span>{site.location}</span>
        <span className="hero-degree">
          {site.degree.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </span>
      </div>

      <div className="hero-main">
        <h1 className="hero-name">
          Oscar
          <br />
          Dalton
        </h1>
        <p className="hero-sub">{site.tagline}</p>
      </div>

      <ul className="hero-areas">
        {research.map((r, i) => (
          <li key={r.id}>
            <a className="px-host" href={`#${r.id}`}>
              <span className="mono-n">{String(i + 1).padStart(2, "0")}</span>
              <Pixel glyph={r.glyph} size={63} spread={1.4} pulse={7000 + i * 1300} />
              <span className="hero-area-name">{r.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
