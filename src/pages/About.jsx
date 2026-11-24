import Pixel from "../components/Pixel.jsx";
import SectionHead from "../components/SectionHead.jsx";
import { site } from "../config.js";

const goldfish = site.places.find((p) => p.name === "Goldfish");

// A phrase in the statement that jumps to its research section, with its glyph.
const Jump = ({ to, g, children, after = "" }) => (
  <span className="nb">
    <a className="jump px-host" href={`#${to}`}>
      {children}
      <span className="inline-px">
        <Pixel glyph={g} size={30} />
      </span>
    </a>
    {after}
  </span>
);

export default function About() {
  return (
    <section id="about" className="block" aria-label="About">
      <SectionHead n="01" title="about" />
      <div className="about-grid">
        <p className="statement">
          I’m an Honors Linguistics and Computer Science double major at{" "}
          <a className="jump" href="https://www.swarthmore.edu" target="_blank" rel="noreferrer">
            Swarthmore
          </a>
          , with a minor in Pure Mathematics. I work on syntactic processing in
          neural{" "}
          <Jump to="lm" g="lm" after=",">
            language models
          </Jump>{" "}
          computational{" "}
          <Jump to="semantics" g="lambda" after=",">
            semantics
          </Jump>{" "}
          <Jump to="morphology" g="split" after=",">
            tokenization
          </Jump>{" "}
          and endangered language{" "}
          <Jump to="documentation" g="doc" after=".">
            documentation
          </Jump>{" "}
          I also build{" "}
          <Jump to="speech" g="wave">
            speech
          </Jump>{" "}
          and{" "}
          <Jump to="finance" g="chart">
            finance
          </Jump>{" "}
          tools with the same methods, and I’m co-founder and CTO of{" "}
          <a className="jump" href={goldfish.href} target="_blank" rel="noreferrer">
            Goldfish
          </a>
          , a venture-backed study app.
        </p>

        <div className="about-side">
          <a className="btn px-host" href="/resume.docx">
            resume <Pixel glyph="arrow" size={14} spread={0.6} />
          </a>
          <div>
            <p className="label">places</p>
            <ul className="places">
              {site.places.map((p) => (
                <li key={p.name}>
                  <a className="px-host" href={p.href} target="_blank" rel="noreferrer">
                    <span className="place-name">{p.name}</span>
                    <span className="place-role">{p.role}</span>
                    <Pixel glyph="arrow" size={11} spread={0.6} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">otherwise</p>
            <p className="small">
              Python, C++, Rust, Swift, Java, JavaScript. English and French.
              Captain of the Swarthmore rugby team, played semiprofessional
              soccer, play upright bass, viola, and guitar. I DJ and live code
              music in Strudel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
