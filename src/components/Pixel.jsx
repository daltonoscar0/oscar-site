import { useEffect, useRef, useState } from "react";

// Bitmaps: "#" is a lit pixel, anything else is empty.
export const GLYPHS = {
  home: [
    "....#....",
    "...###...",
    "..#####..",
    ".#######.",
    "#########",
    ".##...##.",
    ".##...##.",
    ".##...##.",
    ".#######.",
  ],
  about: [
    "..#####..",
    ".#.....#.",
    "#..#.#..#",
    "#.......#",
    "#.......#",
    "#.#...#.#",
    "#..###..#",
    ".#.....#.",
    "..#####..",
  ],
  talk: [
    ".........",
    "#########",
    "##.....##",
    "#.#...#.#",
    "#..#.#..#",
    "#...#...#",
    "#.......#",
    "#########",
    ".........",
  ],
  research: [
    "...###...",
    "...###...",
    ".........",
    "##.....##",
    "##.....##",
    ".........",
    "...###...",
    "...###...",
    ".........",
  ],
  now: [
    "..#####..",
    ".#.....#.",
    "#...#...#",
    "#...#...#",
    "#...###.#",
    "#.......#",
    "#.......#",
    ".#.....#.",
    "..#####..",
  ],
  projects: [
    "###...###",
    "###...###",
    "###...###",
    ".........",
    ".........",
    ".........",
    "###...###",
    "###...###",
    "###...###",
  ],
  commits: [
    ".#.......",
    ".#....##.",
    ".#....##.",
    ".#...#...",
    "###.#....",
    "####.....",
    "###......",
    ".#.......",
    ".#.......",
  ],
  books: [
    ".........",
    ".###.###.",
    "#...#...#",
    "#...#...#",
    "#...#...#",
    "#...#...#",
    "#...#...#",
    ".###.###.",
    "....#....",
  ],
  lm: [
    "##.....##",
    "##.....##",
    "..#...#..",
    "...###...",
    "...###...",
    "...###...",
    "..#...#..",
    "##.....##",
    "##.....##",
  ],
  lambda: [
    "##.......",
    "..#......",
    "..#......",
    "...#.....",
    "...##....",
    "..#..#...",
    "..#..#...",
    ".#....#..",
    "#......##",
  ],
  split: [
    ".........",
    ".........",
    "##.##.###",
    "##.##.###",
    "##.##.###",
    ".........",
    "#...#...#",
    ".........",
    ".........",
  ],
  wave: [
    "....#....",
    "....#....",
    "..#.#....",
    "..#.#.#..",
    "#.#.#.#.#",
    "..#.#.#..",
    "..#.#....",
    "....#....",
    "....#....",
  ],
  chart: [
    "........#",
    "........#",
    ".....#.##",
    "....##.##",
    "....#####",
    ".#..#####",
    "##.######",
    "#########",
    "#########",
  ],
  doc: [
    "#######..",
    "#.....##.",
    "#.###..##",
    "#.......#",
    "#.#####.#",
    "#.......#",
    "#.####..#",
    "#.......#",
    "#########",
  ],
  dot: ["##", "##"],
  arrow: ["....#..", ".....#.", "#######", ".....#.", "....#.."],
};

// 5x7 lowercase letters for the footer wordmark.
const FONT = {
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  l: ["#..", "#..", "#..", "#..", "#..", "#..", ".##"],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#..#", "..##."],
  n: [".....", ".....", "#.##.", "##..#", "#...#", "#...#", "#...#"],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

export function textBitmap(text) {
  const rows = Array.from({ length: 7 }, () => "");
  for (const ch of text.toLowerCase()) {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) rows[r] += g[r] + ".";
  }
  return rows.map((r) => r.slice(0, -1));
}

// Cheap deterministic noise so every render scatters the same way.
function noise(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// One shared observer: pixels fly in the first time a glyph is seen.
let observer;
const callbacks = new WeakMap();
function watch(el, cb) {
  if (typeof IntersectionObserver === "undefined") return cb();
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          callbacks.get(e.target)?.();
          observer.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
  }
  callbacks.set(el, cb);
  observer.observe(el);
  return () => observer.unobserve(el);
}

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A bitmap drawn as squares. The squares assemble when the glyph scrolls
 * into view, scatter when its host (.px-host) is hovered, and with
 * `pulse` they burst apart on a timer and snap back.
 */
export default function Pixel({
  glyph,
  bitmap,
  size = 36,
  spread = 1,
  pulse = 0,
  eager = false,
  className = "",
  title,
}) {
  const rows = bitmap || GLYPHS[glyph] || GLYPHS.dot;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (reduced()) return setInView(true);
    if (eager) {
      // Assemble right after mount, for glyphs that are always on screen.
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    return watch(ref.current, () => setInView(true));
  }, [eager]);

  useEffect(() => {
    if (!pulse || reduced()) return;
    let off;
    const on = setInterval(() => {
      setBurst(true);
      off = setTimeout(() => setBurst(false), 650);
    }, pulse);
    return () => {
      clearInterval(on);
      clearTimeout(off);
    };
  }, [pulse]);

  // Gaps between squares only once squares are big enough to show them.
  const inset = size / w >= 5 ? 0.06 : 0;
  const cells = [];
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== "#") return;
      const i = y * w + x;
      const dx = x - cx || noise(i, 1) - 0.5;
      const dy = y - cy || noise(i, 2) - 0.5;
      const len = Math.hypot(dx, dy) || 1;
      const push = (2 + noise(i, 3) * 4) * spread;
      cells.push(
        <rect
          key={i}
          x={x + inset}
          y={y + inset}
          width={1 - inset * 2}
          height={1 - inset * 2}
          style={{
            "--dx": `${((dx / len) * push).toFixed(2)}px`,
            "--dy": `${((dy / len) * push).toFixed(2)}px`,
            "--d": `${Math.round(noise(i, 4) * 260)}ms`,
          }}
        />,
      );
    });
  });

  return (
    <svg
      ref={ref}
      className={`px${burst ? " is-burst" : ""} ${className}`}
      data-in={inView ? "1" : "0"}
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      <g fill="currentColor">{cells}</g>
    </svg>
  );
}
