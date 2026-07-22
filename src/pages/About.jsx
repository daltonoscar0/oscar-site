export default function About() {
  return (
    <>
      <h1 className="page-title">about</h1>
      <div className="bio">
        <p>
          I'm an undergraduate at Swarthmore College double-majoring in
          Computer Science and Linguistics (expected May 2029). My work sits
          at the intersection of the two: syntactic processing in neural
          language models, computational semantics, and endangered language
          documentation.
        </p>
        <p>
          I'm a research assistant in the Socially Contextualized Syntax Lab
          at Swarthmore, where I evaluate LLM handling of neopronouns and am
          co-authoring a paper on verb-tense shift across pronoun paradigms.
          At NYU I work with Dr. Lucas Champollion on the LambdaCalculator, a
          formal semantics teaching tool. At the CUNY Computational
          Linguistics Lab I do error analysis on grapheme-to-phoneme
          translation models, and with the Endangered Language Alliance and
          Queens College I built speech-to-text models for low-resource Irish
          and contributed to documentation of Nuristani.
        </p>
        <p>
          I'm also co-founder and CTO of Goldfish, a venture-backed consumer
          iOS app ($12,000 raised), which I built end-to-end in Swift while
          carrying a full course load.
        </p>
        <p>
          Selected projects: miniGPT, a from-scratch GPT-style transformer in
          C++17 with no external libraries and a linguistically structured
          vocabulary in place of BPE; Scalpel, a zero-dependency FSM-driven
          tokenizer paired with a finite-state morphological analyzer; and
          contributions to the LambdaCalculator, including a
          CCG-to-first-order-logic pipeline. My independent research on
          garden-path processing in language models is on the projects page.
        </p>
        <p>
          I program in Python, C++, Rust, Swift, Java, and JavaScript. I'm a
          native English speaker and fluent in French. Outside of work I
          captain the Swarthmore rugby team, played semiprofessional soccer,
          and play upright bass, viola, and guitar.
        </p>
      </div>
    </>
  );
}
