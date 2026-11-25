// The three stages, chained, from the browser.
//
// Stage 1 runs here, in WebAssembly. Stages 2 and 3 run on the API, because
// each needs an 82M-parameter encoder and stage 3 also needs a dependency
// parser. The split is visible in this file and nowhere else: `run` returns one
// object with all three stages in it and the component does not know which came
// from where.
//
// Nothing in this file decides anything. Every field it passes on was computed
// by the stage that owns it -- the costs that chose a reading, the probability
// behind a sense, the rule that placed a break. The page's job is to show them.

export const FLAGSHIP =
  "I read the 2nd Dr. Lee lead a live band on Reading Rd at 10:30";

/** Built to show off one stage each. */
export const EXAMPLES = [
  {
    label: "all three stages",
    hint: "the sentence the whole pipeline was specified against",
    text: FLAGSHIP,
  },
  {
    // Nine decisions, and "record" twice with two different pronunciations in
    // the same sentence, which is the whole problem in one clause. "wound"
    // comes back at 0.56, correct but barely, and that is left in: a
    // confidence worth reading has to be able to be low.
    //
    // "a minute tear" was in an earlier version of this sentence and is not
    // any more. The probe reads "minute" as the noun there, which is wrong,
    // and a sentence whose job is to demonstrate the stage should not be
    // carrying a known wrong answer. It is reported in the README instead.
    label: "heteronyms",
    hint: "nine words spelled one way and said two, including one word twice",
    text:
      "The bass player wound the cable, tore a tear in the console, and " +
      "refused to refuse the invalid contract, so we did not record a " +
      "second record.",
  },
  {
    label: "numbers",
    hint: "every numeric class at once",
    text:
      "On 3/14/2015 at 6:45 am the 2nd invoice came to $1,234.50 for " +
      "2.5 km of cable, 3/4 of it billed to 1600 Pennsylvania Ave NW.",
  },
  {
    label: "no punctuation",
    hint: "where does a speaker pause when nothing tells them to",
    text:
      "the man in the grey coat who had been waiting by the door since " +
      "early morning finally asked whether the number of people who " +
      "applied this year was higher than expected",
  },
];

// --------------------------------------------------------------------------
// Stage 1: Sayso, as WebAssembly
// --------------------------------------------------------------------------

// Served as static files rather than bundled. Emscripten's loader resolves the
// .wasm against its own URL, and a bundler that inlines or renames it breaks
// that; keeping both files as plain assets also means the 112 KB download is
// cached independently of the page's JavaScript.
const WASM_BASE = "/frontend/";
const PHONE_STYLE = 1; // the reading a voice gives a form, not the one a page does
const CANONICAL_DATES = 0;

let saysoPromise = null;

/**
 * Load the normaliser. Safe to call repeatedly; every caller awaits one load.
 *
 * Worth calling early and ignoring the result: instantiating costs about 4 ms
 * but the first call builds the grammars, which is about 400 ms once and 0.2 ms
 * every time after. Doing it while the user is still reading the page means
 * they never see it.
 */
export function loadSayso() {
  if (saysoPromise === null) {
    saysoPromise = (async () => {
      const factory = await import(/* @vite-ignore */ `${WASM_BASE}sayso.js`);
      const module = await factory.default({
        locateFile: (file) => `${WASM_BASE}${file}`,
      });
      // Build the grammars now, not on the user's first keystroke.
      callSayso(module, FLAGSHIP);
      return module;
    })();
  }
  return saysoPromise;
}

function callSayso(module, text) {
  const line = text.split(/\r\n|\r|\n/).join(" ");
  // stringToNewUTF8 rather than ccall's marshalling, which allocates on the
  // stack and would overflow on a long paste.
  const pointer = module.stringToNewUTF8(line);
  try {
    return module.UTF8ToString(
      module._sayso_stage_result(pointer, PHONE_STYLE, CANONICAL_DATES),
    );
  } finally {
    module._free(pointer);
  }
}

export async function normalize(text) {
  const module = await loadSayso();
  return JSON.parse(callSayso(module, text));
}

// --------------------------------------------------------------------------
// Stages 2 and 3: the API
// --------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(message, { status = 0, retryAfter = null, detail = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.detail = detail;
  }
}

/**
 * Run stages 2 and 3 over stage 1's output.
 *
 * `pron_hints` and `name_spans` are forwarded exactly as Sayso emitted them.
 * They are the whole reason the stages are chained rather than merely stacked:
 * they carry what the normaliser knew and the next two stages cannot work out
 * for themselves -- that "Doctor Lee" is a name, and that "Reading" here is a
 * town. Reshaping them here would be the place a bug hides, so nothing is
 * reshaped.
 */
export async function prosody(apiBase, sayso, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${apiBase}/v1/pipeline`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        normalized: sayso.output,
        name_spans: sayso.meta?.name_spans ?? [],
        pron_hints: sayso.meta?.pron_hints ?? {},
        system: "both",
      }),
      signal,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") throw cause;
    // No response at all: offline, DNS, CORS, or the service is down. The
    // distinction is not available to a page and guessing would mislead.
    throw new ApiError("could not reach the model service", { detail: String(cause) });
  }

  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
      /* a proxy error page rather than our JSON */
    }
    const retryAfter = Number(response.headers.get("retry-after")) || null;
    throw new ApiError(body.error || `service returned ${response.status}`, {
      status: response.status,
      retryAfter,
      detail: body.detail || "",
    });
  }
  return response.json();
}

// --------------------------------------------------------------------------
// The chain
// --------------------------------------------------------------------------

/**
 * Normalise locally, then ask the API for the other two stages.
 *
 * Returns `{ sayso, lede, caesura, timings_ms }`, with `lede` and `caesura`
 * null when the API could not be reached. Stage 1 is never null: it runs here
 * and has nothing to fail against, which is why the page can still show
 * something useful when the service is down.
 */
export async function run(text, { apiBase, signal } = {}) {
  const sayso = await normalize(text);
  if (!apiBase) return { sayso, lede: null, caesura: null, error: null };
  try {
    const rest = await prosody(apiBase, sayso, { signal });
    return { sayso, ...rest, error: null };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { sayso, lede: null, caesura: null, error };
  }
}

export async function health(apiBase, { signal } = {}) {
  const response = await fetch(`${apiBase}/health`, { signal });
  if (!response.ok) throw new ApiError(`health returned ${response.status}`);
  return response.json();
}

// --------------------------------------------------------------------------
// Turning a decision into a sentence a person can read
//
// These are the only functions here that invent anything, and what they invent
// is prose. Every number and every name in the strings below came from the
// stage that made the decision.
// --------------------------------------------------------------------------

const CLASS_PROSE = {
  ordinal: "an ordinal",
  cardinal: "a number",
  decimal: "a decimal",
  fraction: "a fraction",
  money: "an amount of money",
  measure: "a measurement",
  date: "a date",
  time: "a clock time",
  decade: "a decade",
  range: "a range",
  abbrev: "an abbreviation",
  letters: "an initialism, spelled out",
  telephone: "a telephone number",
  address: "a street address",
  name: "a personal name",
  state: "a place and its state",
  phone: "a phone number",
};

/** Plain-language account of one normalisation decision. */
export function explainNormalization(decision) {
  const what = CLASS_PROSE[decision.kind] || `a ${decision.kind}`;
  const lines = [`Read as ${what}.`];
  const losers = (decision.alternatives || []).filter(
    (a) => a.result !== decision.result,
  );
  if (losers.length) {
    const shown = losers
      .slice(0, 3)
      .map((a) => `“${a.result}” as ${CLASS_PROSE[a.kind] || a.kind}`)
      .join(", ");
    lines.push(`It beat ${shown}.`);
    lines.push(
      "The classifier prices every reading of every span and takes the " +
        "cheapest path across the whole sentence, so a reading can be cheap " +
        "on its own and still lose.",
    );
  }
  return lines.join(" ");
}

/** Plain-language account of one heteronym decision. */
export function explainPronunciation(decision) {
  const sense = decision.label || decision.wordid || "one reading";
  const alternatives = (decision.alternatives || []).filter(
    (a) => a.wordid !== decision.wordid,
  );
  const percent = (p) => `${Math.round(p * 1000) / 10}%`;

  if (decision.rule === "hint") {
    return (
      `Said as the ${sense}. The normaliser already decided this one: it ` +
      `tagged those characters while it still had the capital letters and the ` +
      `abbreviation to go on, and passed the pronunciation forward. ` +
      (alternatives.length
        ? `Otherwise it would have been the ${alternatives[0].label}.`
        : "")
    );
  }
  if (decision.rule === "name-span") {
    return (
      `Said as the ${sense}, because the normaliser marked this a proper name. ` +
      `Inside a name a heteronym takes its proper-noun reading, whatever the ` +
      `rest of the sentence suggests.`
    );
  }

  const chosen = (decision.alternatives || []).find(
    (a) => a.wordid === decision.wordid,
  );
  const parts = [`Said as the ${sense}`];
  if (chosen) parts[0] += `, at ${percent(chosen.probability)} confidence`;
  parts[0] += ".";
  if (alternatives.length) {
    const other = alternatives[0];
    parts.push(
      `The reading it beat was the ${other.label} (${other.pron}), ` +
        `at ${percent(other.probability)}.`,
    );
  }
  parts.push(
    "Decided by a logistic regression over frozen encoder features of this " +
      "sentence — so it is reading the context, not a table.",
  );
  return parts.join(" ");
}

const BREAK_PROSE = {
  b3_utterance_final: "the utterance ends here",
  b3_clause_boundary: "one finite clause ends and another begins",
  b2_appositive: "this closes an appositive, a parenthetical or a vocative",
  b2_fronted_adverbial: "a fronted adverbial or prepositional phrase ends here",
  b2_relative_clause: "a relative clause of four or more words starts here",
  b2_long_subject: "the subject is five words or more and has to be closed before the verb",
  b2_list_item: "this is one item of a list of three or more",
  model: "the sequence labeller put a break here",
};

/** Plain-language account of one break decision. */
export function explainBreak(decision) {
  const rule = decision.rule || "";
  const bare = rule.replace(/^consensus:/, "");
  const reason = BREAK_PROSE[bare] || decision.note || `rule ${bare}`;
  const strength = decision.result?.includes("<b3>")
    ? "A major break"
    : "A minor break";

  const lines = [`${strength}: ${reason}.`];
  if (rule.startsWith("consensus:")) {
    lines.push("Both systems agree, which is the case to trust most.");
  } else if (rule === "model") {
    lines.push(
      `The parser rules wanted nothing here. The union takes the stronger ` +
        `break at each boundary, so the model's wins — a choice made for ` +
        `recall, and the place this stage is most likely to be wrong.`,
    );
    if (typeof decision.score === "number") {
      lines.push(`Model confidence ${Math.round(decision.score * 100)}%.`);
    }
  } else {
    lines.push("Placed by the dependency parse, not by the model.");
  }
  return lines.join(" ");
}

/** Plain-language account of a boundary where a break was suppressed. */
export function explainVeto(reason) {
  if (reason.endsWith("name_span")) {
    const who = reason.startsWith("model:") ? "The sequence labeller" : "A rule";
    return (
      `${who} wanted a break inside a proper name, and it was suppressed. ` +
      `A name is one phonological word however many written words it occupies, ` +
      `and a pause inside it is audibly broken. The normaliser is what knows ` +
      `the name is there: by the time this stage runs, "Doctor Lee" is ` +
      `"doctor lee" with the capitals and the title already gone.`
    );
  }
  if (reason.includes("det_noun")) {
    return "A rule wanted a break between a determiner and its noun. Never allowed.";
  }
  if (reason.includes("aux_verb")) {
    return "A rule wanted a break between an auxiliary and its verb. Never allowed.";
  }
  return `A break was suppressed here (${reason}).`;
}
