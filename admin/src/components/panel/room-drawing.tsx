/**
 * The shop's room as an architect's line drawing (the same scene as the
 * shop's intro loader). Lines draw themselves, then the window and lamp
 * light up, all with CSS so it costs no JavaScript.
 */
function rr(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

const LINES = [
  "M20 400H796",
  "M20 392H796",
  rr(96, 64, 168, 300, 3),
  "M152 64V364M208 64V364M96 214H264",
  "M84 372H276",
  rr(336, 118, 112, 142, 2),
  rr(350, 132, 84, 114, 1),
  "M350 190H434M392 132V246",
  rr(318, 272, 104, 70, 22),
  rr(424, 272, 104, 70, 22),
  rr(530, 272, 104, 70, 22),
  rr(306, 330, 340, 52, 16),
  rr(286, 300, 40, 84, 18),
  rr(626, 300, 40, 84, 18),
  "M300 384H652V392",
  "M352 300l58-6 4 40-58 6z",
  "M712 398V182C712 116 660 92 604 106",
  "M574 138a30 26 0 0 1 60 0z",
  "M690 398h44",
  "M744 400l5-58h36l5 58",
  "M756 342C750 300 753 262 763 228c5 40 5 76 1 114",
  "M770 342C769 292 775 246 787 210c3 50 0 94-7 132",
  "M781 342c2-34 8-58 20-78-2 34-7 58-14 78",
];
const DIMENSIONS = ["M286 430H666", "M286 422V438M666 422V438", "M70 64V364", "M62 64H78M62 364H78"];
const BEAMS = ["M152 64L264 64L560 392L380 392Z", "M96 214L152 214L330 392L240 392Z", "M208 214L264 214L640 392L520 392Z"];

export function RoomDrawing({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  // Lines in cream on dark grounds, in near-black ink on light ones.
  const ink = tone === "light" ? "#2b2a27" : "#efe4d2";
  const dim = tone === "light" ? "#c2410c" : "#e3a56f";
  const delay = (s: number) => ({ animationDelay: `${s}s` });
  return (
    <svg viewBox="0 0 800 480" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <linearGradient id="rd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe9cc" />
          <stop offset="1" stopColor="#e9a46a" />
        </linearGradient>
        <linearGradient id="rd-beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d3a0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#f6d3a0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rd-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f3c58d" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f3c58d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rd-lamp" cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="#ffe3b5" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffe3b5" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="180" cy="214" rx="260" ry="220" fill="url(#rd-sun)" className="fade-in" style={delay(1.6)} />
      {[0, 1, 2].flatMap((c) =>
        [0, 1].map((r) => (
          <rect
            key={`${c}${r}`}
            x={98 + c * 56}
            y={66 + r * 150}
            width={52}
            height={146}
            fill="url(#rd-sky)"
            className="fade-in"
            style={delay(1.5 + (c + r) * 0.1)}
          />
        )),
      )}
      {BEAMS.map((d, i) => (
        <path key={d} d={d} fill="url(#rd-beam)" className="fade-in" style={delay(1.8 + i * 0.15)} />
      ))}
      <path d="M574 138L540 392H670L634 138Z" fill="url(#rd-lamp)" className="fade-in" style={delay(2.1)} />

      <g stroke={ink} strokeWidth={1.6} strokeOpacity={0.9}>
        {LINES.map((d, i) => (
          <path key={i} d={d} pathLength={1} className="draw-line" style={delay(i * 0.05)} />
        ))}
      </g>
      <g stroke={dim} strokeWidth={1.2}>
        {DIMENSIONS.map((d, i) => (
          <path key={d} d={d} pathLength={1} className="draw-line" style={delay(1 + i * 0.1)} />
        ))}
      </g>
      <g fill={dim} fontFamily="var(--font-mono-face), monospace" fontSize="11" letterSpacing="2">
        <text x="476" y="456" textAnchor="middle" className="fade-in" style={delay(1.5)}>
          W 220 CM
        </text>
        <text x="54" y="214" textAnchor="middle" transform="rotate(-90 54 214)" className="fade-in" style={delay(1.6)}>
          H 240 CM
        </text>
      </g>
    </svg>
  );
}
