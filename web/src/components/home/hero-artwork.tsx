"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * The home hero picture: an original SVG living room in morning light.
 *
 * A black steel window throws crisp panes of sunlight across a limewashed
 * plaster wall and an oak floor. A low oatmeal boucle sofa, a black-framed
 * abstract print, a walnut table with a stoneware vase of dry branches, a
 * black arc lamp and a snake plant complete the room. Three layers drift
 * with the mouse for depth, the sunlight slowly breathes and dust floats in
 * the beam. Everything is still when the visitor prefers reduced motion.
 *
 * Drawn in a portrait 800×1000 frame and anchored bottom-centre, so narrow
 * (landscape) crops keep the sofa in view.
 */

// Dust in the beam: fixed, rounded values so server and client markup match.
const MOTES = Array.from({ length: 26 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12543.123;
  return {
    x: Math.round(330 + (a - Math.floor(a)) * 380),
    y: Math.round(160 + (b - Math.floor(b)) * 520),
    r: 1 + ((i * 7) % 4) * 0.5,
    d: 10 + ((i * 5) % 8),
    delay: (i % 9) * 0.8,
  };
});

// Sunlight on the wall: the window's six panes, projected and sheared.
const WALL_PANES = [0, 1, 2].flatMap((c) =>
  [0, 1].map((r) => {
    const x = 392 + c * 118;
    const y = 150 + r * 214 + c * 34;
    return `${x},${y} ${x + 98},${y + 26} ${x + 98},${y + 220} ${x},${y + 194}`;
  }),
);

// Oak boards, converging slightly towards the back of the room.
const BOARDS = Array.from({ length: 11 }, (_, i) => {
  const xb = -120 + i * 110;
  const xt = 120 + i * 62;
  return `M${xt} 742L${xb} 1000`;
});

function useDepth(mx: MotionValue<number>, my: MotionValue<number>, amount: number) {
  const x = useSpring(useTransform(mx, [-1, 1], [amount, -amount]), { stiffness: 60, damping: 22 });
  const y = useSpring(useTransform(my, [-1, 1], [amount * 0.6, -amount * 0.6]), { stiffness: 60, damping: 22 });
  return { x, y };
}

export function HeroArtwork({ play }: { play: boolean }) {
  const reduce = useReducedMotion() ?? false;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const far = useDepth(mx, my, 5);
  const mid = useDepth(mx, my, 11);
  const near = useDepth(mx, my, 20);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  const loop = (duration: number, delay = 0) =>
    reduce
      ? { duration: 0 }
      : { duration, delay, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const };
  const show = play || reduce;

  return (
    <motion.div
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-[#cfc4b5] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/10 lg:rounded-[2.25rem]"
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0% round 2.25rem)" }}
      animate={show ? { clipPath: "inset(0% 0% 0% 0% round 2.25rem)" } : undefined}
      transition={{ duration: 1.4, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
    >
      <motion.svg
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 size-full"
        role="img"
        aria-label="Illustration of a sunlit living room: a black steel window casting light across a plaster wall, a low oatmeal sofa, an abstract print, a walnut table with a vase of dry branches, an arc lamp and a snake plant"
        initial={reduce ? false : { scale: 1.12 }}
        animate={show ? { scale: 1 } : undefined}
        transition={{ duration: 2.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="ha-wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d8cdbd" />
            <stop offset="0.55" stopColor="#cbbfad" />
            <stop offset="1" stopColor="#b7aa97" />
          </linearGradient>
          <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4efe6" />
            <stop offset="0.7" stopColor="#efe3d0" />
            <stop offset="1" stopColor="#e9d6ba" />
          </linearGradient>
          <linearGradient id="ha-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a47b55" />
            <stop offset="1" stopColor="#7a5838" />
          </linearGradient>
          <linearGradient id="ha-sun" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff6e4" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffe9c4" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="ha-beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff4dc" stopOpacity="0.32" />
            <stop offset="1" stopColor="#fff4dc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ha-seat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#efe7da" />
            <stop offset="1" stopColor="#d3c7b5" />
          </linearGradient>
          <linearGradient id="ha-cushion" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3ece1" />
            <stop offset="0.6" stopColor="#e2d8c9" />
            <stop offset="1" stopColor="#cdbfac" />
          </linearGradient>
          <linearGradient id="ha-walnut" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4a2f1e" />
            <stop offset="0.5" stopColor="#6b4529" />
            <stop offset="1" stopColor="#3d2618" />
          </linearGradient>
          <linearGradient id="ha-leaf" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2c3a29" />
            <stop offset="0.5" stopColor="#4d6143" />
            <stop offset="1" stopColor="#25311f" />
          </linearGradient>
          <linearGradient id="ha-pot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1b1917" />
            <stop offset="0.4" stopColor="#3a3632" />
            <stop offset="1" stopColor="#141210" />
          </linearGradient>
          <linearGradient id="ha-vase" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#bfae98" />
            <stop offset="0.45" stopColor="#e2d6c4" />
            <stop offset="1" stopColor="#a8967f" />
          </linearGradient>
          <radialGradient id="ha-shade" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#3b2b1c" stopOpacity="0.45" />
            <stop offset="1" stopColor="#3b2b1c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ha-glow" cx="0.2" cy="0.25" r="0.75">
            <stop offset="0" stopColor="#fff3dd" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff3dd" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ha-vignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor="#1a120b" stopOpacity="0" />
            <stop offset="1" stopColor="#1a120b" stopOpacity="0.35" />
          </linearGradient>
          <filter id="ha-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="ha-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="ha-plaster" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="3" seed="4" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.16 0" />
          </filter>
          <filter id="ha-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.09 0" />
          </filter>
          <pattern id="ha-boucle" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill="#b9ab97" opacity="0.16" />
            <circle cx="5.5" cy="5" r="0.8" fill="#fffaf2" opacity="0.22" />
          </pattern>
          <clipPath id="ha-window">
            <rect x="48" y="96" width="282" height="520" />
          </clipPath>
        </defs>

        {/* Far: plaster wall, window and its sunlight */}
        <motion.g style={reduce ? undefined : far}>
          <rect x="-40" y="-40" width="880" height="790" fill="url(#ha-wall)" />
          <rect x="-40" y="-40" width="880" height="790" filter="url(#ha-plaster)" />
          <rect x="-40" y="-40" width="880" height="790" fill="url(#ha-glow)" />

          {/* window: bright morning sky with a hazy skyline */}
          <g clipPath="url(#ha-window)">
            <rect x="48" y="96" width="282" height="520" fill="url(#ha-sky)" />
            <path d="M48 616V470h40v-52h34v70h30v-110h46v124h28v-70h38v40h30v-96h36v270z" fill="#d9cfc2" opacity="0.75" />
            <path d="M48 616V530h56v-30h44v60h52v-40h48v50h40v-24h42v70z" fill="#cbbfae" opacity="0.8" />
          </g>
          <g stroke="#1b1816" fill="none">
            <rect x="48" y="96" width="282" height="520" strokeWidth="12" />
            <path d="M142 96v520M236 96v520M48 356h282" strokeWidth="6" />
          </g>
          <rect x="34" y="616" width="310" height="12" fill="#efe6d8" />
          <rect x="34" y="628" width="310" height="5" fill="#a8998a" />

          {/* sunlight panes on the wall */}
          <motion.g
            filter="url(#ha-soft)"
            animate={reduce ? undefined : { x: [0, 10], opacity: [0.82, 1] }}
            transition={loop(11)}
          >
            {WALL_PANES.map((points) => (
              <polygon key={points} points={points} fill="url(#ha-sun)" opacity="0.62" />
            ))}
          </motion.g>

          {/* black-framed abstract print */}
          <g>
            <rect x="398" y="290" width="176" height="220" fill="#16130f" />
            <rect x="407" y="299" width="158" height="202" fill="#f3eee6" />
            <rect x="425" y="317" width="122" height="166" fill="#e9e1d4" />
            <rect x="425" y="317" width="70" height="98" fill="#2a2622" />
            <rect x="495" y="372" width="52" height="111" fill="#b0643f" />
            <rect x="442" y="431" width="53" height="52" fill="#c7a77c" />
            <path d="M425 415h122M495 317v166" stroke="#16130f" strokeWidth="3" />
            {/* light crossing the print */}
            <polygon points="398,350 470,368 470,510 398,510" fill="#fff5e1" opacity="0.18" />
          </g>

          {/* skirting */}
          <rect x="-40" y="728" width="880" height="16" fill="#e4dacb" />
        </motion.g>

        {/* Mid: floor, rug, sofa, lamp */}
        <motion.g style={reduce ? undefined : mid}>
          <rect x="-40" y="742" width="880" height="300" fill="url(#ha-floor)" />
          <g stroke="#5c3f26" strokeOpacity="0.45" strokeWidth="1.4">
            {BOARDS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {/* sunlight on the floor */}
          <motion.g
            filter="url(#ha-soft)"
            animate={reduce ? undefined : { x: [0, 14], opacity: [0.75, 1] }}
            transition={loop(11)}
          >
            <polygon points="70,760 168,760 300,1000 140,1000" fill="#ffeccb" opacity="0.4" />
            <polygon points="178,760 272,760 452,1000 316,1000" fill="#ffeccb" opacity="0.4" />
            <polygon points="282,760 330,760 560,1000 462,1000" fill="#ffeccb" opacity="0.32" />
          </motion.g>
          {/* the beam through the air */}
          <motion.polygon
            points="70,96 330,96 820,760 420,760"
            fill="url(#ha-beam)"
            animate={reduce ? undefined : { opacity: [0.6, 1] }}
            transition={loop(7)}
          />

          {/* rug */}
          <polygon points="150,806 790,806 860,960 70,960" fill="#e6ddcf" />
          <polygon points="150,806 790,806 860,960 70,960" fill="none" stroke="#cbbfad" strokeWidth="6" />

          {/* arc lamp */}
          <g>
            <ellipse cx="742" cy="816" rx="40" ry="8" fill="#1a1715" />
            <path d="M742 812V440C742 330 700 290 650 300" stroke="#1a1715" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M614 340a38 32 0 0 1 76 0z" fill="#1d1a17" />
            <path d="M650 300v8" stroke="#1a1715" strokeWidth="4" />
            <ellipse cx="652" cy="340" rx="38" ry="5" fill="#f7e2bd" opacity="0.9" />
            <ellipse cx="652" cy="420" rx="60" ry="70" fill="#fff0d2" opacity="0.12" filter="url(#ha-blur)" />
          </g>

          {/* sofa contact shadow */}
          <ellipse cx="520" cy="806" rx="300" ry="26" fill="url(#ha-shade)" filter="url(#ha-blur)" />

          {/* low modular boucle sofa */}
          <g>
            <rect x="268" y="772" width="510" height="22" rx="4" fill="#2b2420" />
            {/* back cushions */}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={300 + i * 152} y="600" width="158" height="118" rx="34" fill="url(#ha-cushion)" />
                <rect x={300 + i * 152} y="600" width="158" height="118" rx="34" fill="url(#ha-boucle)" />
              </g>
            ))}
            {/* seat */}
            <rect x="282" y="694" width="496" height="84" rx="22" fill="url(#ha-seat)" />
            <rect x="282" y="694" width="496" height="84" rx="22" fill="url(#ha-boucle)" />
            <path d="M448 700v72M612 700v72" stroke="#c4b6a2" strokeWidth="2" />
            {/* arms */}
            <rect x="256" y="640" width="58" height="138" rx="26" fill="url(#ha-cushion)" />
            <rect x="256" y="640" width="58" height="138" rx="26" fill="url(#ha-boucle)" />
            <rect x="750" y="640" width="58" height="138" rx="26" fill="url(#ha-cushion)" />
            <rect x="750" y="640" width="58" height="138" rx="26" fill="url(#ha-boucle)" />
            {/* throw cushion in rust linen */}
            <rect x="338" y="642" width="96" height="74" rx="18" fill="#a95c37" transform="rotate(-6 386 679)" />
            <path d="M344 664l84 -8" stroke="#8c4a2b" strokeWidth="2" opacity="0.6" />
            {/* sunlight across the sofa */}
            <polygon points="282,694 420,694 470,778 282,778" fill="#fff7e8" opacity="0.22" />
          </g>
        </motion.g>

        {/* Near: walnut table, vase, plant */}
        <motion.g style={reduce ? undefined : near}>
          <ellipse cx="400" cy="930" rx="230" ry="20" fill="url(#ha-shade)" filter="url(#ha-blur)" />
          {/* walnut coffee table */}
          <g transform="translate(110 0)">
          <polygon points="110,860 500,860 520,880 90,880" fill="#7a5233" />
          <rect x="90" y="880" width="430" height="20" fill="url(#ha-walnut)" />
          <rect x="112" y="900" width="18" height="40" fill="#3a2416" />
          <rect x="480" y="900" width="18" height="40" fill="#3a2416" />
          {/* books */}
          <rect x="350" y="846" width="110" height="14" fill="#2d2925" />
          <rect x="358" y="834" width="96" height="12" fill="#c9bba5" />
          </g>
          {/* stoneware vase with dry branches */}
          <g transform="translate(90 0)">
            <path d="M200 860c-20 0-26-24-20-48 4-16 12-22 12-34h40c0 12 8 18 12 34 6 24 0 48-20 48z" fill="url(#ha-vase)" />
            <g stroke="#4b3524" strokeWidth="2.2" fill="none" strokeLinecap="round">
              <path d="M214 780C210 720 190 680 160 640" />
              <path d="M196 704l-22 -18M184 680l10 -26" />
              <path d="M220 780C228 710 250 670 286 640" />
              <path d="M240 700l26 -6M256 676l-6 -24" />
              <path d="M216 780V620" />
              <path d="M216 668l14 -16M216 650l-12 -14" />
            </g>
          </g>
          {/* snake plant in a black planter */}
          <g>
            <path d="M8 1000l10-150h108l10 150z" fill="url(#ha-pot)" />
            <rect x="12" y="846" width="120" height="10" rx="3" fill="#2a2724" />
            <g fill="url(#ha-leaf)">
              <path d="M40 850C30 760 34 690 52 610c10 80 12 160 6 240z" />
              <path d="M64 850C60 740 70 640 92 560c8 100 4 200-10 290z" />
              <path d="M90 850c0-80 14-150 40-212 2 80-8 150-24 212z" />
              <path d="M30 850c-14-50-22-100-18-150 18 40 28 96 30 150z" />
              <path d="M110 850c10-60 26-104 52-138-6 56-20 100-38 138z" />
            </g>
            <g stroke="#a7b38c" strokeOpacity="0.35" strokeWidth="1.5" fill="none">
              <path d="M52 612c8 80 10 160 4 236M92 562c6 100 2 200-12 286" />
            </g>
          </g>
        </motion.g>

        {/* dust in the light */}
        {!reduce &&
          MOTES.map((m, i) => (
            <motion.circle
              key={i}
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="#fffaf0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0], y: [0, -26, -52], x: [0, 8, 2] }}
              transition={{ duration: m.d, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

        <rect x="0" y="0" width="800" height="1000" fill="url(#ha-vignette)" />
        <rect x="0" y="0" width="800" height="1000" filter="url(#ha-grain)" />
      </motion.svg>

      {/* caption */}
      <motion.p
        className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-white/90 uppercase backdrop-blur-md sm:top-5 sm:left-5"
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={show ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.8, delay: 1.3 }}
      >
        <span className="size-1.5 rounded-full bg-[#f3cf9e]" aria-hidden />
        Living room · Morning light
      </motion.p>
    </motion.div>
  );
}
