// The demo page: one box, four stages, every decision inspectable.
//
// The explanation for a highlighted word is rendered into a fixed row under its
// stage rather than into a floating tooltip. That is a deliberate choice for
// the phone: a tooltip has to be positioned, it can leave the viewport, and it
// cannot be read while the thing it describes is under a thumb. A fixed row is
// in the same place every time on both.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Imported here rather than by the site's entry point, so the stylesheet
// travels in the same lazy chunk as the component and `make sync-site` has
// one fewer thing to get right.
import "./frontend.css";

import {
  EXAMPLES,
  FLAGSHIP,
  explainBreak,
  explainNormalization,
  explainPronunciation,
  explainVeto,
  loadSayso,
  normalize,
  prosody,
} from "./pipeline.js";
import breaksResults from "./results/breaks.json";
import heteronymResults from "./results/heteronyms.json";
import normalizationResults from "./results/normalization.json";

// Where the model service lives. A build-time value so the page can be pointed
// at a local service, the Space, or oscarpdalton.com/api/frontend without a
// code change -- the Space is a stopgap and the move is expected.
const API_BASE =
  import.meta.env?.VITE_FRONTEND_API ??
  "https://daltonoscar0-tts-front-end-api.hf.space";

// Long enough that typing a sentence is one request rather than thirty, short
// enough to feel like it answered. Stage 1 is not debounced at all: it runs in
// 0.2 ms locally, so it updates on the keystroke.
const DEBOUNCE_MS = 650;

// --------------------------------------------------------------------------
// Rendering text with spans highlighted
// --------------------------------------------------------------------------

/**
 * Cut `text` into runs by `spans`, so each decided span can be its own element.
 *
 * Offsets are byte offsets from the C++ side and character offsets from the
 * Python side. They agree for everything the demo accepts, because the input
 * box is ASCII in practice -- but a paste of smart quotes or an accent would
 * make them disagree, so non-ASCII input is reported rather than mis-sliced.
 * See `asciiOnly` below.
 */
// How a pointer opens an explanation.
//
// Every path opens; nothing toggles. That is not laziness, it is the only
// version that survives the event sequence a real tap produces. Chrome
// delivers, for one tap on a button:
//
//   pointerover:touch  pointerenter:touch  pointerdown:touch  touchstart
//   pointerup:touch    touchend           mouseover  mouseenter
//   mousedown  mouseup  click:touch
//
// A `focus` lands in there too, because the target is a button. So any design
// where one of those opens and a later one toggles will open and immediately
// close again -- and with eleven events in play, which pair collides depends on
// whether the element was already focused, whether the pointer was already
// over it, and which browser. The phone symptom is that the explanation never
// appears at all, which is invisible from a desktop and is the only way most
// people will read this.
//
// So: hover opens, focus opens, tap opens, and `Detail` carries an explicit
// dismiss. Reaching another word replaces the open one, which is what someone
// reading through the sentence is doing anyway.
function openers(key, openKey, onOpen) {
  return {
    "aria-expanded": openKey === key,
    onPointerEnter: (event) => {
      // Only a real pointer. A tap also emits pointerenter, and letting it
      // through here puts us back in the collision above.
      if (event.pointerType === "mouse") onOpen(key);
    },
    onFocus: () => onOpen(key),
    onClick: () => onOpen(key),
  };
}

function cut(text, spans) {
  const ordered = [...spans].sort((a, b) => a.start - b.start);
  const runs = [];
  let cursor = 0;
  for (const span of ordered) {
    if (span.start < cursor || span.end > text.length) continue; // overlapping or stale
    if (span.start > cursor) runs.push({ text: text.slice(cursor, span.start) });
    runs.push({ text: text.slice(span.start, span.end), span });
    cursor = span.end;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor) });
  return runs;
}

function Marked({ text, spans, openKey, onOpen, tone = "change" }) {
  const runs = useMemo(() => cut(text, spans), [text, spans]);
  return (
    <p className="fx-text">
      {runs.map((run, index) =>
        run.span ? (
          <button
            key={index}
            type="button"
            className={`fx-mark fx-${run.span.tone || tone} ${
              openKey === run.span.key ? "is-open" : ""
            }`}
            {...openers(run.span.key, openKey, onOpen)}
          >
            {run.text}
          </button>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </p>
  );
}

function Detail({ open, explanations, onClose }) {
  const body = open ? explanations[open] : null;
  return (
    <div className={`fx-detail ${body ? "is-open" : ""}`} aria-live="polite">
      {body ? (
        <>
          <span className="fx-detail-head">{body.head}</span>
          <span className="fx-detail-body">{body.text}</span>
          <button
            type="button"
            className="fx-detail-close"
            aria-label="close this explanation"
            onClick={onClose}
          >
            ×
          </button>
        </>
      ) : (
        <span className="fx-detail-idle">
          Hover or tap a highlighted word to see what was decided and why.
        </span>
      )}
    </div>
  );
}

function Stage({ n, name, what, children }) {
  return (
    <section className="fx-stage">
      <header className="fx-stage-head">
        <span className="mono-n">{n}</span>
        <h3>{name}</h3>
        <span className="fx-stage-what">{what}</span>
      </header>
      {children}
    </section>
  );
}

// --------------------------------------------------------------------------
// The four stages
// --------------------------------------------------------------------------

function OriginalStage({ text, sayso, open, onOpen }) {
  const spans = useMemo(
    () =>
      (sayso?.decisions ?? []).map((d, i) => ({
        start: d.span[0],
        end: d.span[1],
        key: `in-${i}`,
      })),
    [sayso],
  );
  const explanations = useMemo(() => {
    const out = {};
    (sayso?.decisions ?? []).forEach((d, i) => {
      out[`in-${i}`] = {
        head: `“${d.surface}” → “${d.result}”`,
        text: explainNormalization(d),
      };
    });
    return out;
  }, [sayso]);

  return (
    <Stage n="00" name="what you typed" what={`${spans.length} span${spans.length === 1 ? "" : "s"} to rewrite`}>
      <Marked text={text} spans={spans} openKey={open} onOpen={onOpen} tone="found" />
      <Detail open={open} explanations={explanations} onClose={() => onOpen(null)} />
    </Stage>
  );
}

function NormalizedStage({ sayso, open, onOpen }) {
  const spans = useMemo(
    () =>
      (sayso?.decisions ?? [])
        .filter((d) => Array.isArray(d.out_span))
        .map((d, i) => ({
          start: d.out_span[0],
          end: d.out_span[1],
          key: `out-${i}`,
        })),
    [sayso],
  );
  const explanations = useMemo(() => {
    const out = {};
    (sayso?.decisions ?? [])
      .filter((d) => Array.isArray(d.out_span))
      .forEach((d, i) => {
        out[`out-${i}`] = {
          head: `“${d.surface}” → “${d.result}”`,
          text: explainNormalization(d),
        };
      });
    return out;
  }, [sayso]);

  return (
    <Stage n="01" name="normalised" what="sayso · WebAssembly, in this tab">
      <Marked text={sayso?.output ?? ""} spans={spans} openKey={open} onOpen={onOpen} />
      <Detail open={open} explanations={explanations} onClose={() => onOpen(null)} />
    </Stage>
  );
}

function PhonemeStage({ sayso, lede, open, onOpen }) {
  const spans = useMemo(
    () =>
      (lede?.decisions ?? []).map((d, i) => ({
        start: d.start,
        end: d.end,
        key: `ph-${i}`,
        tone: d.rule === "hint" || d.rule === "name-span" ? "handed" : "change",
      })),
    [lede],
  );
  const explanations = useMemo(() => {
    const out = {};
    (lede?.decisions ?? []).forEach((d, i) => {
      out[`ph-${i}`] = {
        head: `“${d.token}” → ${d.pron}`,
        text: explainPronunciation(d),
      };
    });
    return out;
  }, [lede]);

  const oov = lede?.meta?.oov ?? [];

  return (
    <Stage
      n="02"
      name="phonemes"
      what={
        lede
          ? `${lede.meta.n_decisions} heteronym${
              lede.meta.n_decisions === 1 ? "" : "s"
            } resolved · lede`
          : "lede"
      }
    >
      {lede ? (
        <>
          <Marked
            text={sayso?.output ?? ""}
            spans={spans}
            openKey={open}
            onOpen={onOpen}
          />
          <p className="fx-phones">{lede.pronunciation}</p>
          {oov.length > 0 && (
            <p className="fx-note">
              Not in the dictionary, and deliberately not guessed:{" "}
              {oov.join(", ")}. A front end that invents a pronunciation is worse
              than one that says it does not know.
            </p>
          )}
          <Detail open={open} explanations={explanations} onClose={() => onOpen(null)} />
        </>
      ) : (
        <p className="fx-text fx-waiting">—</p>
      )}
    </Stage>
  );
}

function BreakStage({ caesura, open, onOpen }) {
  const words = caesura?.meta?.words ?? [];
  const breaks = caesura?.meta?.breaks ?? [];
  const emphasis = caesura?.meta?.emphasis ?? {};
  const vetoed = caesura?.meta?.vetoed ?? {};

  const byIndex = useMemo(() => {
    // There is one decision per inserted break, in position order -- both
    // properties are asserted by caesura's own contract tests -- so the n-th
    // decision belongs to the n-th boundary whose label is not "none". Zipping
    // those two is exact. Matching on the surface text instead would go wrong
    // on any sentence that repeats a word.
    const out = {};
    const decisions = caesura?.decisions ?? [];
    let next = 0;
    breaks.forEach((label, index) => {
      if (label === "none") return;
      if (next < decisions.length) out[index] = decisions[next++];
    });
    return out;
  }, [caesura, breaks]);

  const explanations = useMemo(() => {
    const out = {};
    Object.entries(byIndex).forEach(([index, d]) => {
      out[`br-${index}`] = {
        head: `break after “${words[index]}”`,
        text: explainBreak(d),
      };
    });
    Object.entries(vetoed).forEach(([index, reason]) => {
      out[`veto-${index}`] = {
        head: `no break after “${words[index]}”`,
        text: explainVeto(reason),
      };
    });
    return out;
  }, [byIndex, vetoed, words]);

  if (!caesura) {
    return (
      <Stage n="03" name="phrase breaks" what="caesura">
        <p className="fx-text fx-waiting">—</p>
      </Stage>
    );
  }

  const count = breaks.filter((b) => b !== "none").length;

  return (
    <Stage
      n="03"
      name="phrase breaks"
      what={`${count} break${count === 1 ? "" : "s"} · caesura`}
    >
      <p className="fx-text">
        {words.map((word, i) => (
          <span key={i}>
            <span className={emphasis[word] ? "fx-emph" : undefined}>{word}</span>
            {breaks[i] !== "none" && (
              <button
                type="button"
                className={`fx-brk fx-brk-${breaks[i]} ${
                  open === `br-${i}` ? "is-open" : ""
                }`}
                aria-label={`break after ${words[i]}`}
                {...openers(`br-${i}`, open, onOpen)}
              >
                {breaks[i] === "b3" ? "‖" : "│"}
              </button>
            )}
            {vetoed[String(i)] && (
              <button
                type="button"
                className={`fx-veto ${open === `veto-${i}` ? "is-open" : ""}`}
                aria-label={`suppressed break after ${words[i]}`}
                {...openers(`veto-${i}`, open, onOpen)}
              >
                ⊘
              </button>
            )}{" "}
          </span>
        ))}
      </p>
      <p className="fx-legend">
        <span className="fx-brk fx-brk-b2">│</span> minor break{" "}
        <span className="fx-brk fx-brk-b3">‖</span> major break{" "}
        <span className="fx-veto">⊘</span> break suppressed{" "}
        <span className="fx-emph">word</span> emphasis
      </p>
      <Detail open={open} explanations={explanations} onClose={() => onOpen(null)} />
    </Stage>
  );
}

// --------------------------------------------------------------------------
// Evaluation tables
// --------------------------------------------------------------------------

function pct(x) {
  return `${(x * 100).toFixed(1)}%`;
}

function NormalizationTable() {
  const r = normalizationResults;
  const [showAll, setShowAll] = useState(false);
  const causes = Object.entries(r.causes);
  const failures = showAll ? r.failures : r.failures.slice(0, 8);
  return (
    <div className="fx-eval">
      <h4>
        Normalisation — {r.correct} of {r.n} hard cases, {pct(r.accuracy)}
      </h4>
      <p className="fx-note">
        A set written by hand for this demo, by reading each input aloud and
        writing down what came out <em>before</em> running anything. It is
        adversarial on purpose: three of its categories exist because probing
        found a weakness, so this number is lower than sayso's 93.9% on a
        held-out shard of the Google text normalisation corpus and should be. The
        system under test is the WebAssembly build this page loads, not a copy.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>class</th><th>n</th><th>accuracy</th></tr>
          </thead>
          <tbody>
            {Object.entries(r.per_class).map(([name, b]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="num">{b.n}</td>
                <td className="num">{pct(b.accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h5>{r.failures.length} failures, and what each is</h5>
      <p className="fx-note">
        Eleven named causes, not thirty-two problems. Seven of the failures are
        documented decisions rather than defects.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>cause</th><th>n</th><th>what it is</th></tr>
          </thead>
          <tbody>
            {causes.map(([name, info]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td className="num">{info.n}</td>
                <td>{info.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h5>Every failing case</h5>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>input</th><th>it said</th><th>it should say</th><th>cause</th></tr>
          </thead>
          <tbody>
            {failures.map((f) => (
              <tr key={f.input}>
                <td><code>{f.input}</code></td>
                <td className="bad">{f.got}</td>
                <td>{f.expected}</td>
                <td><code className="fx-cause">{f.cause}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.failures.length > 8 && (
        <button type="button" className="fx-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? "show fewer" : `show all ${r.failures.length}`}
        </button>
      )}
    </div>
  );
}

function HeteronymTable() {
  const r = heteronymResults;
  const [showAll, setShowAll] = useState(false);
  const words = Object.entries(r.words_below_100_percent);
  const failures = showAll ? r.failures : r.failures.slice(0, 8);
  return (
    <div className="fx-eval">
      <h4>
        Heteronyms — {r.micro} micro on {r.n} sentences, {r.errors} errors
      </h4>
      <p className="fx-note">
        Wikipedia Homograph Data, evaluation split, 162 curated homographs.
        Published with Gorman, Mazovetskiy and Nikolaev (LREC 2018), whose best
        system scores {r.pos_baseline?.paper_best_hybrid_micro} on it. A
        part-of-speech tagger with a majority vote already reaches{" "}
        {r.pos_baseline?.pos_rule_micro} here, and that — not the{" "}
        {r.pos_baseline?.mle_micro} most-likely-reading baseline — is the number
        worth beating. 95% interval [{r.micro_ci[0]}, {r.micro_ci[1]}], so this
        is a consistent lead over the paper rather than a separated one.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>system</th><th>micro</th><th>errors</th></tr>
          </thead>
          <tbody>
            <tr><td>most likely reading</td><td className="num">{r.pos_baseline?.mle_micro}</td><td className="num">{r.pos_baseline?.mle_errors}</td></tr>
            <tr><td>part-of-speech rules</td><td className="num">{r.pos_baseline?.pos_rule_micro}</td><td className="num">{r.pos_baseline?.pos_rule_errors}</td></tr>
            <tr><td>Gorman et al. 2018, best</td><td className="num">{r.pos_baseline?.paper_best_hybrid_micro}</td><td className="num">~16</td></tr>
            <tr className="fx-ours"><td>this probe ({r.encoder})</td><td className="num">{r.micro}</td><td className="num">{r.errors}</td></tr>
          </tbody>
        </table>
      </div>
      <h5>Where the errors are</h5>
      <p className="fx-note">
        {words.length} of {r.n_homographs} words are below 100%. The rest are
        perfect, so this table is the whole of what is wrong.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>word</th><th>n</th><th>accuracy</th><th>type</th></tr>
          </thead>
          <tbody>
            {words.map(([word, info]) => (
              <tr key={word}>
                <td><code>{word}</code></td>
                <td className="num">{info.n}</td>
                <td className="num">{pct(info.accuracy)}</td>
                <td>{info.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h5>What kind of error each one is</h5>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>bucket</th><th>n</th><th>what it means</th></tr>
          </thead>
          <tbody>
            {Object.entries(r.failure_buckets).map(([name, info]) => (
              <tr key={name}>
                <td><code>{name}</code></td>
                <td className="num">{info.n}</td>
                <td>{info.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h5>Every error</h5>
      <p className="fx-note">
        The training-example count beside each reading is the point: a reading
        the corpus never shows cannot be produced by any classifier fit on it.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr><th>word</th><th>should be</th><th>it said</th><th>sentence</th></tr>
          </thead>
          <tbody>
            {failures.map((f, i) => (
              <tr key={i}>
                <td><code>{f.homograph}</code></td>
                <td>
                  {f.gold}{" "}
                  <span className="fx-support">{f.gold_train_examples} train</span>
                </td>
                <td className="bad">
                  {f.predicted}{" "}
                  <span className="fx-support">{f.predicted_train_examples} train</span>
                </td>
                <td className="fx-sentence">{f.sentence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.failures.length > 8 && (
        <button type="button" className="fx-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? "show fewer" : `show all ${r.failures.length}`}
        </button>
      )}
    </div>
  );
}

const BREAK_SYSTEMS = [
  ["final_only", "break on the last word only"],
  ["punctuation", "written punctuation"],
  ["rules", "A · dependency rules"],
  ["model", "B · distilroberta"],
  ["both", "A + B, union"],
];

const SET_LABELS = {
  libritts_test: ["LibriTTS-R test-clean", "gold derived from punctuation"],
  switchboard: ["Switchboard", "conversational, gold derived from punctuation"],
  adversarial: ["adversarial", "60 sentences, gold annotated by hand"],
};

function BreakTable() {
  const r = breaksResults;
  const adversarial = r.results.adversarial.systems;
  const buckets = Object.keys(adversarial.punctuation.by_construction);
  return (
    <div className="fx-eval">
      <h4>Phrase breaks — precision, recall and F1 per boundary</h4>
      <p className="fx-note">
        Read the caveat before the numbers. The gold for the first two sets is
        derived from punctuation, and punctuation is not prosody: a reader pauses
        after a long subject where written English puts no comma at all, and
        every one of those boundaries is labelled “no break” in training. Only
        the adversarial set is annotated by hand. They disagree, and the
        disagreement is the finding.
      </p>
      {Object.entries(r.results).map(([setName, block]) => (
        <div key={setName}>
          <h5>
            {SET_LABELS[setName][0]}{" "}
            <span className="fx-support">
              {block.n_utterances} utterances, {block.n_boundaries} boundaries ·{" "}
              {SET_LABELS[setName][1]}
            </span>
          </h5>
          <div className="fx-scroll">
            <table>
              <thead>
                <tr>
                  <th>system</th>
                  <th>b2 F1</th><th>b3 F1</th>
                  <th>any P</th><th>any R</th><th>any F1</th>
                </tr>
              </thead>
              <tbody>
                {BREAK_SYSTEMS.filter(([k]) => block.systems[k]).map(([key, label]) => {
                  const s = block.systems[key];
                  const baseline = key === "final_only" || key === "punctuation";
                  return (
                    <tr key={key} className={baseline ? "fx-baseline" : undefined}>
                      <td>{label}</td>
                      <td className="num">{s.b2.f1}</td>
                      <td className="num">{s.b3.f1}</td>
                      <td className="num">{s.any.p}</td>
                      <td className="num">{s.any.r}</td>
                      <td className="num strong">{s.any.f1}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <h5>The punctuation baseline, and where it runs out</h5>
      <p className="fx-note">
        Written-English punctuation for all 60 adversarial sentences, written by
        hand, then turned into breaks by the same function that derived the
        training labels. It beats every system on the aggregate — which is worth
        saying plainly, because it is the opposite of a flattering result. This
        table is why. Where written English licenses a comma, punctuation is
        near-perfect and the models are worse than it. Where it licenses nothing
        — a reduced relative, a long subject, a break at no punctuation site, 28
        of the 60 sentences — punctuation recovers <strong>none</strong> of the
        minor breaks, by construction, and the dependency rules recover most of
        them. That is the entire case for the stage existing.
      </p>
      <div className="fx-scroll">
        <table>
          <thead>
            <tr>
              <th>construction</th>
              <th>punctuation</th>
              <th>A · rules</th>
              <th>B · model</th>
              <th>A + B</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket}>
                <td><code>{bucket}</code></td>
                {["punctuation", "rules", "model", "both"].map((system) => {
                  const value =
                    adversarial[system]?.by_construction?.[bucket]?.b2?.r;
                  const zero = value === 0;
                  return (
                    <td key={system} className={`num ${zero ? "bad" : ""}`}>
                      {value === undefined ? "—" : `${value.toFixed(1)}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fx-note">
        Minor-break recall, hand-annotated gold. The aggregate hides this and the
        breakdown is the honest version of it.
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------
// The page
// --------------------------------------------------------------------------

function asciiOnly(text) {
  // The C++ side reports byte offsets and the Python side character offsets.
  // They agree on ASCII and diverge on anything else, which would show up as
  // highlights sliding off the words they describe. Better to say so.
  // eslint-disable-next-line no-control-regex
  return !/[^\x00-\x7F]/.test(text);
}

export default function Frontend() {
  const [text, setText] = useState(FLAGSHIP);
  const [sayso, setSayso] = useState(null);
  const [rest, setRest] = useState(null);
  const [apiState, setApiState] = useState("idle"); // idle | loading | ok | error
  const [apiError, setApiError] = useState(null);
  const [open, setOpen] = useState(null);
  const abortRef = useRef(null);

  // Stage 1 is local and costs 0.2 ms, so it runs on the keystroke.
  useEffect(() => {
    let live = true;
    normalize(text)
      .then((result) => live && setSayso(result))
      .catch(() => live && setSayso(null));
    return () => {
      live = false;
    };
  }, [text]);

  // Warm the module while the visitor is still reading, so the one-off 400 ms
  // of grammar construction is never on their first keystroke.
  useEffect(() => {
    loadSayso().catch(() => {});
  }, []);

  // Stages 2 and 3, debounced and abortable.
  useEffect(() => {
    if (!sayso?.output?.trim()) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setApiState("loading");
      try {
        const result = await prosody(API_BASE, sayso, { signal: controller.signal });
        setRest(result);
        setApiError(null);
        setApiState("ok");
      } catch (error) {
        if (error?.name === "AbortError") return;
        setApiError(error);
        setApiState("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [sayso]);

  const pick = useCallback((example) => {
    setOpen(null);
    setText(example);
  }, []);

  const ascii = asciiOnly(text);

  return (
    <article className="fx" id="frontend">
      <header className="fx-head">
        <span className="label">text front end for speech synthesis</span>
        <h1>
          Before a voice can say a sentence, something has to decide how to say
          it.
        </h1>
        <p className="fx-lede">
          <strong>“I read the 2nd Dr. Lee lead a live band on Reading Rd at
          10:30.”</strong>{" "}
          Is <em>read</em> past or present? Is <em>lead</em> the metal or the
          verb? Is <em>Reading</em> a town or something you do? Type anything
          below and watch three stages work it out — and see exactly what each
          one decided, and why.
        </p>
      </header>

      <div className="fx-box">
        <label className="label" htmlFor="fx-input">
          your sentence
        </label>
        <textarea
          id="fx-input"
          value={text}
          rows={3}
          spellCheck={false}
          onChange={(event) => {
            setOpen(null);
            setText(event.target.value);
          }}
        />
        <div className="fx-examples">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              className={`fx-example ${text === example.text ? "is-on" : ""}`}
              title={example.hint}
              onClick={() => pick(example.text)}
            >
              {example.label}
            </button>
          ))}
        </div>
        {!ascii && (
          <p className="fx-warn">
            That text has characters outside ASCII. The stages report offsets in
            bytes and in characters respectively, which agree on ASCII and not
            otherwise, so the highlights below may sit on the wrong words. The
            phonemes and breaks are still correct.
          </p>
        )}
      </div>

      <div className="fx-stages">
        <OriginalStage text={text} sayso={sayso} open={open} onOpen={setOpen} />
        <NormalizedStage sayso={sayso} open={open} onOpen={setOpen} />

        {apiState === "error" ? (
          <div className="fx-down">
            <h3>The model service is not answering.</h3>
            <p>
              {apiError?.status === 429
                ? `Too many requests from this address. ${
                    apiError.retryAfter
                      ? `Try again in ${apiError.retryAfter} seconds.`
                      : "Try again in a moment."
                  }`
                : apiError?.status === 413
                  ? `That input is too long. ${apiError.detail}`
                  : apiError?.status === 503
                    ? "It is still loading its models. This takes about fifteen seconds from cold; it will answer shortly."
                    : "It may be asleep — it runs on a free CPU host that idles out, and the first request after that can take half a minute to wake it."}
            </p>
            <p className="fx-note">
              Normalisation above is unaffected: it runs in this tab as
              WebAssembly and needs nothing from the network. The other two
              stages each need an 82M-parameter encoder, and the last one a
              dependency parser, which is why they are not in the tab.
            </p>
            <button type="button" className="fx-more" onClick={() => setSayso({ ...sayso })}>
              try again
            </button>
          </div>
        ) : (
          <>
            <PhonemeStage
              sayso={sayso}
              lede={rest?.lede ?? null}
              open={open}
              onOpen={setOpen}
            />
            <BreakStage caesura={rest?.caesura ?? null} open={open} onOpen={setOpen} />
            {apiState === "loading" && (
              <p className="fx-loading">
                <span className="fx-spin" aria-hidden="true" /> asking the model
                service for phonemes and breaks…
              </p>
            )}
            {apiState === "ok" && rest?.timings_ms && (
              <p className="fx-timing">
                lede {rest.timings_ms.lede} ms · caesura {rest.timings_ms.caesura} ms
              </p>
            )}
          </>
        )}
      </div>

      <section className="fx-prose">
        <h2>How it works</h2>
        <div className="fx-cols">
          <div>
            <h3>1 · Normalise</h3>
            <p>
              A bidirectional weighted finite-state transducer, one grammar per
              semiotic class, written once in the speaking direction. Read
              forwards it verbalises; read backwards — the same machines — it
              does dictation-style inverse normalisation. No model weights and no
              rule list: ambiguity is settled by taking the cheapest path across
              the whole sentence, which is why <code>2nd Dr</code> does not
              become “second drive” even though that reading is cheaper on its
              own.
            </p>
            <p className="fx-note">
              Zero dependencies, so it compiles to WebAssembly and runs in this
              tab: 112 KB gzipped, 0.2 ms a sentence once warm. Its output here
              is byte-identical to the native binary on 10,308 test sentences,
              which is the test that makes “the demo is the evaluated system”
              true rather than hopeful.
            </p>
          </div>
          <div>
            <h3>2 · Pronounce</h3>
            <p>
              Every word to phones, with heteronyms resolved from context. The
              disambiguator is a linear probe on <em>frozen</em> encoder
              features: mean-pool the wordpieces over the target word, then one
              logistic regression per homograph — 162 of them, nothing
              fine-tuned, 1.7 MB of weights.
            </p>
            <p className="fx-note">
              Words outside the dictionary are emitted as{" "}
              <code>&lt;oov:WORD&gt;</code> rather than guessed. Guessing
              pronunciations is a separate model with its own evaluation, and a
              front end that silently invents one is worse than a front end that
              admits it does not know.
            </p>
          </div>
          <div>
            <h3>3 · Phrase breaks</h3>
            <p>
              Where a speaker pauses, from the words alone, with the punctuation
              stripped — because phone transcripts and model output arrive
              without reliable punctuation, so the front end has to decide. Two
              systems: seven rules over a dependency parse, and a token
              classifier. The page shows their union and marks which one placed
              each break.
            </p>
            <p className="fx-note">
              Where a break goes is a syntactic decision about constituent
              boundaries, which is why the parse is in here at all and why the
              rules beat the model on hand-annotated prosody while losing badly
              to it on punctuation-derived gold.
            </p>
          </div>
        </div>

        <h3>What the stages tell each other</h3>
        <p>
          The three are chained, not stacked. The normaliser knows things the
          next two stages cannot recover: it tagged <code>Dr. Lee</code> a name
          and <code>Reading Rd</code> an address while it still had the capital
          letters and the abbreviations to go on. It passes both forward, as
          character spans and pronunciation hints.
        </p>
        <p>
          That matters most in the last stage. By the time breaks are predicted,
          “Doctor Lee” is “doctor lee” and nothing in the text distinguishes it
          from two ordinary nouns — so the token classifier puts a major break
          between them, at 40% confidence, and the recall-oriented union
          inherits it. A pause inside a name is audibly broken however the rest
          of the sentence is phrased. Told where the names are, the stage refuses
          the boundary. You can see the suppression marked ⊘ on the flagship
          sentence above.
        </p>

        <h2>Evaluation</h2>
        <p className="fx-note">
          Every number below comes from a saved run in the repository, not from
          this page: <code>results/normalization.json</code>,{" "}
          <code>results/heteronyms.json</code>, <code>results/breaks.json</code>
          . Each has a <code>--check</code> mode that fails if the numbers move.
          The failure tables are the part worth reading.
        </p>
        <NormalizationTable />
        <HeteronymTable />
        <BreakTable />

        <h2>Code</h2>
        <ul className="fx-repos">
          <li>
            <a href="https://github.com/daltonoscar0/frontend-demo">frontend-demo</a>
            <span> the chain, the WebAssembly build, the API, the evaluation and this page</span>
          </li>
          <li>
            <a href="https://github.com/daltonoscar0/sayso">sayso</a>
            <span> stage 1 · bidirectional weighted-FST normalisation, zero dependencies</span>
          </li>
          <li>
            <a href="https://github.com/daltonoscar0/Contextual-Homograph-Disambiguation-for-TTS">Lede</a>
            <span> stage 2 · heteronym disambiguation and grapheme-to-phoneme</span>
          </li>
          <li>
            <a href="https://github.com/daltonoscar0/caesura">caesura</a>
            <span> stage 3 · phrase-break and emphasis prediction</span>
          </li>
        </ul>
        <p className="fx-note">
          No analytics and no tracking. The text you type goes to the model
          service for stages 3 and 4 and is not stored; stages 1 and 2 never
          leave this tab.
        </p>
      </section>
    </article>
  );
}
