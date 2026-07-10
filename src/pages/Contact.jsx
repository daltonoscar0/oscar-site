import { site } from "../config.js";

export default function Contact() {
  return (
    <>
      <h1 className="page-title">contact</h1>
      <ul className="contact-list">
        {site.contact.map((c) => {
          const external = c.href.startsWith("http");
          return (
            <li key={c.label}>
              <a
                className="contact-link"
                href={c.href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <span className="contact-label">{c.label}</span>
                <span className="contact-value">
                  {c.value}
                  <span className="contact-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
