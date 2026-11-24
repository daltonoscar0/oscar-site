// Research areas, in the order they appear on the page.
// `glyph` is a key in components/Pixel.jsx GLYPHS. `href` is optional.

const gh = (repo) => `https://github.com/daltonoscar0/${repo}`;

export const research = [
  {
    id: "lm",
    name: "language models",
    glyph: "lm",
    items: [
      {
        title: "The Price of Reanalysis",
        text: "Sole author. Garden-path effects in GPT-2-large and Pythia-1.4B are large (5 to 6.5 bits) but don't change with linear distance. Revising for the next ARR cycle.",
        href: "/papers/price-of-reanalysis.pdf",
      },
      {
        title: "Psycholinguistics Lab, Swarthmore",
        text: "Analyzing garden-path processing across language models using surprisal.",
      },
      {
        title: "Self-paced reading with Dan Grodner",
        text: "Part of the Psycholinguistics Lab. The same garden-path question with human participants: PCIbex self-paced reading experiments on reduced relatives, run on Prolific.",
      },
      {
        title: "Socially Contextualized Syntax Lab",
        text: "SoCS Lab. Co-authoring a paper on verb shift across neopronominal agreement paradigms; I presented the project launch at NWAV54. Before that I studied how language models handle neopronominal copular agreement.",
      },
    ],
  },
  {
    id: "semantics",
    name: "semantics",
    glyph: "lambda",
    items: [
      {
        title: "LambdaCalculator",
        text: "Chief research intern at NYU with Dr. Lucas Champollion. Fixing bugs, adding new features, and choosing what to optimize in the computing and software stack of the formal semantics teaching tool.",
        href: "https://github.com/nyusemantics/LambdaCalculatorPublic",
      },
      {
        title: "lambda",
        text: "CYK chart parser for CCG, composing meanings by beta-reduction into first-order logic. Since absorbed into LambdaCalculator.",
        href: gh("lambda"),
      },
    ],
  },
  {
    id: "morphology",
    name: "tokenization",
    glyph: "split",
    items: [
      {
        title: "Scalpel",
        text: "Zero-dependency FST tokenizer in C++ producing typed tokens.",
        href: gh("Scalpel"),
      },
      {
        title: "Finite-State Morphological Analysis",
        text: "Morphological analyzer built on Scalpel's token stream, scored against MorphoLex.",
        href: gh("Finite-State-Morphological-Analysis"),
      },
      {
        title: "Morpheme-aware LM for Irish",
        text: "End-to-end low-resource Irish pipeline on top of Scalpel.",
        href: gh("Morpheme-Aware-Language-Modeling-for-Irish"),
      },
      {
        title: "miniGPT",
        text: "Decoder-only transformer from scratch in C++17, with Scalpel as its vocabulary layer.",
        href: gh("miniGPT"),
      },
    ],
  },
  {
    id: "speech",
    name: "speech",
    glyph: "wave",
    items: [
      {
        title: "sayso",
        text: "Bidirectional weighted-FST text normalization: one grammar per class, read forwards for TTS and inverted for dictation. 13 classes.",
        href: gh("sayso"),
      },
      {
        title: "Homograph disambiguation for TTS",
        text: "Frozen-encoder linear probes on the Wikipedia Homograph Data. Matches or beats Gorman et al. (2018) with no fine-tuning.",
        href: gh("Contextual-Homograph-Disambiguation-for-TTS"),
      },
      {
        title: "caesura",
        text: "Phrase-break and emphasis prediction from syntax on unpunctuated text.",
        href: gh("caesura"),
      },
      {
        title: "mend",
        text: "Dictation cleanup. Synthetic disfluencies resolve a third of real self-repairs; adding real speech gets half.",
        href: gh("mend"),
      },
      {
        title: "hem",
        text: "The inverse of mend: disfluency insertion with a naturalness dial.",
        href: gh("hem"),
      },
      {
        title: "Grapheme-to-phoneme",
        text: "Error analysis on G2P models at the CUNY Computational Linguistics Lab, 2024 to 2025.",
      },
    ],
  },
  {
    id: "finance",
    name: "finance",
    glyph: "chart",
    items: [
      {
        title: "Matching engine and market simulator",
        text: "C++ limit order book matching engine with a generative simulator of market activity.",
        href: gh("A-Matching-Engine-and-Market-Simulator"),
      },
      {
        title: "Short-horizon prediction from order flow",
        text: "Learned representations against microstructure baselines at 1 to 10 second horizons, under purged walk-forward evaluation.",
        href: gh("Short-Horizon-Prediction-from-Order-Flow"),
      },
      {
        title: "Interpretability of market language models",
        text: "Probing, activation patching, and sparse autoencoders on transformers trained on market data.",
        href: gh("Interpretability-of-Market-Language-Models"),
      },
      {
        title: "Hybrid retrieval over SEC filings",
        text: "BM25 plus dense retrieval with rank fusion over EDGAR filings and earnings calls, with surprisal-based novelty scoring.",
        href: gh("Hybrid-Retreival-over-SEC-Filings"),
      },
      {
        title: "Auditing backtests",
        text: "Static and model audit of trading-research repos for lookahead, leakage, survivorship, and overfitting, with line-cited findings.",
        href: gh("Auditing-Backtests-for-Leakage-and-Bias"),
      },
      {
        title: "Calibration in a betting market",
        text: "Twenty seasons of Premier League odds: calibration, favorite-longshot bias, and a manager-sacking event study.",
        href: gh("Calibration-and-Repricing-in-a-Prediction-Market"),
      },
    ],
  },
  {
    id: "documentation",
    name: "documentation",
    glyph: "doc",
    items: [
      {
        title: "Irish morphological tokenizer with Jane Adkins",
        text: "A morphological tokenizer for Irish with Jane Adkins, a PhD candidate at DCU. Built on Scalpel's finite-state model of Irish initial mutations.",
      },
      {
        title: "Irish speech-to-text",
        text: "Speech-to-text models for low-resource Irish, with the Endangered Language Alliance and Queens College.",
      },
      {
        title: "Nuristani",
        text: "Contributed to documentation of Nuristani, including ELAN annotation.",
      },
    ],
  },
];
