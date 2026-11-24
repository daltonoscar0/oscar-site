import { useEffect } from "react";

// A little trail of pixels that scatter and fade behind the cursor, like the
// glyphs bursting apart. Mouse/trackpad only; skipped for touch screens and
// for anyone with reduced motion turned on.
const GAP = 22; // px of movement between dropped pixels
const LIFE = 700; // ms each pixel lives

export default function CursorTrail() {
  useEffect(() => {
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    const layer = document.createElement("div");
    layer.className = "trail";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    let lastX = null;
    let lastY = null;
    const drop = (x, y) => {
      const p = document.createElement("i");
      const a = Math.random() * Math.PI * 2;
      const d = 10 + Math.random() * 18;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--tx", `${Math.cos(a) * d}px`);
      p.style.setProperty("--ty", `${Math.sin(a) * d + 8}px`);
      p.style.animationDuration = `${LIFE}ms`;
      layer.appendChild(p);
      setTimeout(() => p.remove(), LIFE);
    };

    const onMove = (e) => {
      if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < GAP) return;
      lastX = e.clientX;
      lastY = e.clientY;
      // drop a pixel just behind the arrow's tip
      drop(e.clientX + 6, e.clientY + 14);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      layer.remove();
    };
  }, []);

  return null;
}
