// ─────────────────────────────────────────────────────────────
// SOCIAL WRITINGS & ACADEMIC PAPERS
// GitHub projects are pulled automatically from the GitHub API —
// you never list those here. These two arrays are for everything
// else. Each entry appears as a card on the Projects page,
// filterable by its tags.
// ─────────────────────────────────────────────────────────────

export const writings = [
  // TODO: add social writings as they're published. Example shape:
  //
  // {
  //   title: "Your Big Brother Doesn't Love You: On Surveillance",
  //   description: "A long-form essay on state and corporate surveillance as a unified architecture.",
  //   href: "https://…",
  //   date: "2026",
  //   tags: ["social paper"],
  // },
];

export const papers = [
  // TODO: add academic papers as they're published. Example shape:
  //
  // {
  //   title: "Paper title",
  //   description: "Venue · co-authors · one-line summary.",
  //   href: "https://…",     // arXiv / ACL Anthology / PDF link
  //   date: "2027",
  //   tags: ["academic paper"],
  // },
  {
    title:
      "The Price of Reanalysis: Varying Ambiguous-Region Length in NP/Z Garden Paths to Dissociate Structural from Linear Prediction",
    description:
      "Independent research · Shows that garden-path effects in GPT-2-large and Pythia-1.4B are large (5–6.5 bits) but invariant to linear distance, ruling out strictly local and recency-weighted linear accounts of reanalysis and establishing the behavioral pattern an encoded-but-not-used account of syntactic structure requires.",
    href: "/papers/price-of-reanalysis.pdf",
    date: "2026",
    tags: ["academic paper"],
  },
];
