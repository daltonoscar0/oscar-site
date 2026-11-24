import { Link, useLocation } from "react-router-dom";
import Pixel, { textBitmap } from "../components/Pixel.jsx";
import { site } from "../config.js";
import { sections, jumpTo } from "../components/Nav.jsx";

const WORDMARK = textBitmap(site.name);

export default function Contact() {
  const { pathname } = useLocation();
  return (
    <footer id="contact" className="footer" aria-label="Contact">
      <div className="footer-grid">
        <div>
          <p className="shead-n footer-n">06</p>
          <h2 className="footer-title">say hi.</h2>
          <nav className="footer-nav" aria-label="Footer navigation">
            {sections
              .filter((s) => s.id !== "contact")
              .map((s) => (
                <Link
                  key={s.id}
                  to={s.route || `/#${s.id}`}
                  onClick={(e) => jumpTo(e, s.id, pathname)}
                >
                  {s.label}
                </Link>
              ))}
          </nav>
        </div>

        <ul className="contact-grid">
          {site.contact.map((c) => {
            const external = c.href.startsWith("http");
            return (
              <li key={c.label}>
                <a
                  className="px-host"
                  href={c.href}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  <span className="contact-label">{c.label.toLowerCase()}</span>
                  <span className="contact-value">{c.value}</span>
                  <Pixel glyph="arrow" size={12} spread={0.6} />
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="wordmark px-host">
        <Pixel bitmap={WORDMARK} size={1200} spread={3} title={site.name} />
      </div>
      <p className="footer-meta">
        <span>{site.location}</span>
        <span>© {new Date().getFullYear()}</span>
      </p>
    </footer>
  );
}
