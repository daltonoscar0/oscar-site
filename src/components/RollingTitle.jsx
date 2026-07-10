import { useState, useEffect } from "react";
import { site } from "../config.js";

const TYPE_MS = 75;
const DELETE_MS = 40;
const HOLD_MS = 2600;

export default function RollingTitle() {
  const phrases = site.rollingTitles;
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let timeout;

    if (!deleting && text === current) {
      // Single phrase: type once and stop.
      if (phrases.length === 1) return;
      timeout = setTimeout(() => setDeleting(true), HOLD_MS);
    } else if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(
        () => {
          setText(
            deleting
              ? current.slice(0, text.length - 1)
              : current.slice(0, text.length + 1)
          );
        },
        deleting ? DELETE_MS : TYPE_MS
      );
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, index, phrases]);

  return (
    <h1 className="rolling-title" aria-label={phrases[0]}>
      {text}
      <span className="cursor" aria-hidden="true">
        ▍
      </span>
    </h1>
  );
}
