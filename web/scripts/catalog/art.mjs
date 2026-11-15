/**
 * Hand-built SVG "studio shots" for the catalogue.
 *
 * Every product image is a front view of the piece standing on a floor in
 * front of an arched wall niche, with soft shading, a contact shadow, a little
 * styling (plants, lamps, books) and a fine grain. Drawers below take a few
 * parameters (colour, arm style, legs…) so one function covers many products.
 *
 * Canvas is 800 × 1000 (4:5, the product card ratio).
 */

export const W = 800;
export const H = 1000;
const FY = 800; // floor line
const CX = 400;

/* ------------------------------------------------------------------ utils */

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return "#" + rgb.map((v) => clamp(v + (target - v) * p).toString(16).padStart(2, "0")).join("");
}

/** Small deterministic random generator so art is identical on every run. */
export function rng(seedText) {
  let h = 1779033703;
  for (const ch of seedText) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

function makeCtx(seed) {
  let n = 0;
  const defs = [];
  const stopList = (stops) =>
    stops.map(([o, col, op = 1]) => `<stop offset="${o}" stop-color="${col}"${op === 1 ? "" : ` stop-opacity="${op}"`}/>`).join("");
  const c = {
    defs,
    rand: rng(seed),
    id: (p = "d") => `${p}${n++}`,
    lin(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
      const id = c.id("g");
      defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopList(stops)}</linearGradient>`);
      return `url(#${id})`;
    },
    rad(stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy } = {}) {
      const id = c.id("r");
      const focus = fx !== undefined ? ` fx="${fx}" fy="${fy}"` : "";
      defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${focus}>${stopList(stops)}</radialGradient>`);
      return `url(#${id})`;
    },
    /** Top-lit vertical shading for upholstery and solid parts. */
    soft(col, a = 0.13, b = -0.15) {
      return c.lin([[0, shade(col, a)], [1, shade(col, b)]]);
    },
    /** Rounded-volume horizontal shading (arms, posts, legs). */
    side(col) {
      return c.lin([[0, shade(col, -0.16)], [0.45, shade(col, 0.1)], [1, shade(col, -0.2)]], { x2: 1, y2: 0 });
    },
    pattern(body, w, h, extra = "") {
      const id = c.id("p");
      defs.push(`<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${extra}>${body}</pattern>`);
      return `url(#${id})`;
    },
  };
  return c;
}

const rect = (x, y, w, h, rx, fill, extra = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${fill}"${extra}/>`;

/** Rectangle with only the top corners rounded. */
function topRound(x, y, w, h, r, rb = 6) {
  return `M${f(x)} ${f(y + h - rb)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - rb)}Q${f(x + w)} ${f(y + h)} ${f(x + w - rb)} ${f(y + h)}H${f(x + rb)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - rb)}Z`;
}

/** Tapered leg as a polygon: top centre (x, y1) to bottom centre (x2, y2). */
function leg(x, y1, x2, y2, wTop, wBot, fill, extra = "") {
  return `<polygon points="${f(x - wTop / 2)},${f(y1)} ${f(x + wTop / 2)},${f(y1)} ${f(x2 + wBot / 2)},${f(y2)} ${f(x2 - wBot / 2)},${f(y2)}" fill="${fill}"${extra}/>`;
}

const highlight = (x1, y, x2, op = 0.28, w = 2) =>
  `<path d="M${f(x1)} ${f(y)}H${f(x2)}" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;

/* --------------------------------------------------------------- palettes */

/**
 * Backdrops. Names are kept for the catalogue specs, but every palette is a
 * neutral architectural finish: plaster, concrete, stone, oak and walnut.
 *   wall:  "panel" (recessed plaster panel), "slats" (timber slat wall),
 *          "fluted" (vertical fluted plaster), "plain"
 *   floor: "planks" (wood boards in perspective) or "concrete"
 */
export const PALETTES = {
  // warm greige plaster, oak boards
  sand: { top: "#e6e2dc", bottom: "#d6d1c9", wall: "panel", floor: "planks", floorCol: ["#b49c80", "#977f64"], skirt: "#ece9e4", wood: "#8a6c50" },
  // pale concrete, polished concrete floor
  clay: { top: "#dcd9d4", bottom: "#c8c4be", wall: "fluted", floor: "concrete", floorCol: ["#a6a29c", "#8b8781"], skirt: "#e2dfdb", wood: "#6d5a48" },
  // stone grey with smoked-oak slat wall
  sage: { top: "#dbdad4", bottom: "#c9c8c0", wall: "slats", floor: "planks", floorCol: ["#a08a71", "#85715a"], skirt: "#e1e0db", wood: "#6a5442" },
  // cool grey plaster, concrete floor
  mist: { top: "#dfe0e0", bottom: "#cbcdcd", wall: "panel", floor: "concrete", floorCol: ["#9e9d9a", "#83827f"], skirt: "#e8e9e9", wood: "#5d554e" },
  // taupe plaster, walnut slats and walnut floor
  blush: { top: "#d9d3cc", bottom: "#c5bdb4", wall: "slats", floor: "planks", floorCol: ["#6e5442", "#563f31"], skirt: "#e0dbd5", wood: "#4f3a2c" },
  // travertine-toned fluted plaster, oak floor
  ochre: { top: "#e2dbcf", bottom: "#cfc5b6", wall: "fluted", floor: "planks", floorCol: ["#a3876a", "#866b50"], skirt: "#e9e3da", wood: "#7a5d44" },
  // charcoal gallery
  noir: { top: "#2b2927", bottom: "#1c1a19", wall: "slats", floor: "planks", floorCol: ["#2c2723", "#191614"], skirt: "#33302d", wood: "#3a2e25", dark: true },
};

/* ------------------------------------------------------------------ decor */

/** Sculptural snake plant in a cylindrical matte planter. */
function plant(c, x, { pot = "#3a3836", h = 1, leaf = "#3e4a3b" } = {}) {
  const r = c.rand;
  const potW = 84 * h;
  const potH = 118 * h;
  const top = FY - potH;
  let s = "";
  const leaves = 9;
  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1) - 0.5;
    const baseX = x + t * potW * 0.55;
    const len = (230 + r() * 150 - Math.abs(t) * 120) * h;
    const lean = (t * 90 + (r() - 0.5) * 30) * h;
    const wB = (14 + r() * 8) * h;
    const tipX = baseX + lean;
    const tipY = top - len;
    const col = shade(leaf, (r() - 0.5) * 0.25);
    const d = `M${f(baseX - wB / 2)} ${f(top + 6)}C${f(baseX - wB * 0.8 + lean * 0.3)} ${f(top - len * 0.45)} ${f(tipX - wB * 0.35)} ${f(tipY + len * 0.2)} ${f(tipX)} ${f(tipY)}C${f(tipX + wB * 0.35)} ${f(tipY + len * 0.2)} ${f(baseX + wB * 0.8 + lean * 0.3)} ${f(top - len * 0.45)} ${f(baseX + wB / 2)} ${f(top + 6)}Z`;
    s += `<path d="${d}" fill="${c.lin([[0, shade(col, -0.18)], [0.5, shade(col, 0.12)], [1, shade(col, -0.22)]], { x2: 1, y2: 0 })}"/>`;
    s += `<path d="M${f(baseX)} ${f(top + 4)}Q${f(baseX + lean * 0.4)} ${f(top - len * 0.5)} ${f(tipX)} ${f(tipY + 6)}" stroke="${shade(col, 0.3)}" stroke-opacity=".25" stroke-width="${f(1.4 * h)}" fill="none"/>`;
  }
  // cylindrical planter with a crisp rim
  s += rect(x - potW / 2, top, potW, potH, 3 * h, c.side(pot));
  s += rect(x - potW / 2, top, potW, 6 * h, 2, shade(pot, 0.12));
  return s;
}

/** Minimal arc floor lamp: stone base, black steel arm, matte black dome. */
function floorLamp(c, x, { dir = 1, metal = "#1e1d1c", shadeCol = "#2a2928" } = {}) {
  const topY = FY - 620;
  const hx = x + dir * 190;
  let s = "";
  s += `<ellipse cx="${hx}" cy="${topY + 200}" rx="170" ry="140" fill="${c.rad([[0, "#ffe8c6", 0.32], [1, "#ffe8c6", 0]])}"/>`;
  s += `<path d="M${x} ${FY - 22}V${topY + 70}Q${x} ${topY} ${f(x + dir * 70)} ${topY}H${f(hx - dir * 30)}Q${hx} ${topY} ${hx} ${topY + 40}" stroke="${metal}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${hx - 44} ${topY + 104}Q${hx - 40} ${topY + 44} ${hx} ${topY + 42}Q${hx + 40} ${topY + 44} ${hx + 44} ${topY + 104}Z" fill="${c.lin([[0, shade(shadeCol, -0.1)], [0.4, shade(shadeCol, 0.25)], [1, shade(shadeCol, -0.2)]], { x2: 1, y2: 0 })}"/>`;
  s += `<ellipse cx="${hx}" cy="${topY + 104}" rx="44" ry="6" fill="#fff4de"/>`;
  s += rect(x - 42, FY - 22, 84, 22, 3, c.side("#cfc8bc"));
  s += rect(x - 42, FY - 22, 84, 4, 2, "#e2dcd2");
  return s;
}

/** Black-framed abstract print: charcoal block, a fine line and one muted tone. */
function wallArt(c, { x = CX, y = 150, w = 230, h = 290, tone = "#8f7d69", dark = false } = {}) {
  const x0 = x - w / 2;
  let s = `<rect x="${x0 + 6}" y="${y + 10}" width="${w}" height="${h}" fill="#000" opacity="${dark ? 0.35 : 0.12}" filter="url(#soft)"/>`;
  s += rect(x0, y, w, h, 1, dark ? "#141312" : "#1d1c1b");
  s += rect(x0 + 8, y + 8, w - 16, h - 16, 0, dark ? "#2e2b28" : "#f4f2ee");
  const ix = x0 + 34;
  const iy = y + 34;
  const iw = w - 68;
  const ih = h - 68;
  s += rect(ix, iy, iw, ih, 0, dark ? "#383430" : "#ebe8e2");
  s += rect(ix, iy + ih * 0.38, iw * 0.58, ih * 0.62, 0, dark ? "#1b1a19" : "#2c2b29");
  s += rect(ix + iw * 0.58, iy + ih * 0.16, iw * 0.42, ih * 0.22, 0, tone);
  s += `<path d="M${f(ix + iw * 0.76)} ${f(iy + ih * 0.38)}V${f(iy + ih)}" stroke="${dark ? "#8a8178" : "#2c2b29"}" stroke-width="1.5"/>`;
  return s;
}

/** Stone cylinder lamp with a linen drum shade. */
function tableLamp(c, x, y, { base = "#cfc7bb", shadeCol = "#ece8e1" } = {}) {
  let s = `<ellipse cx="${x}" cy="${y - 120}" rx="110" ry="90" fill="${c.rad([[0, "#ffe9c8", 0.4], [1, "#ffe9c8", 0]])}"/>`;
  s += rect(x - 22, y - 78, 44, 78, 3, c.side(base));
  s += `<path d="M${x} ${y - 78}V${y - 96}" stroke="#2a2826" stroke-width="3"/>`;
  s += `<path d="M${x - 54} ${y - 92}L${x - 46} ${y - 160}H${x + 46}L${x + 54} ${y - 92}Z" fill="${c.soft(shadeCol, 0.08, -0.1)}"/>`;
  return s;
}

function books(c, x, y, colors, { upright = false } = {}) {
  let s = "";
  if (upright) {
    let cx = x;
    colors.forEach((col, i) => {
      const w = 16 + ((i * 7) % 9);
      const h = 70 + ((i * 13) % 34);
      s += rect(cx, y - h, w, h, 2, c.soft(col, 0.1, -0.12));
      s += `<path d="M${cx + 3} ${y - h + 12}H${cx + w - 3}" stroke="#fff" stroke-opacity=".35"/>`;
      cx += w + 2;
    });
    return s;
  }
  let cy = y;
  colors.forEach((col, i) => {
    const w = 120 - i * 12 + (i % 2) * 8;
    const h = 18 + (i % 3) * 3;
    s += rect(x - w / 2 + (i % 2 ? 6 : -4), cy - h, w, h, 3, c.soft(col, 0.1, -0.12));
    s += `<path d="M${x - w / 2 + 6 + (i % 2 ? 6 : -4)} ${cy - h / 2}H${x + w / 2 - 10}" stroke="#fff" stroke-opacity=".3"/>`;
    cy -= h;
  });
  return s;
}

/** Matte ceramic vessel with a single sculptural dried branch. */
function vase(c, x, y, { col = "#c9c4bc", stems = "#5b4c3f", h = 1 } = {}) {
  let s = "";
  const top = y - 78 * h;
  s += `<path d="M${f(x)} ${f(top + 4)}C${f(x - 6 * h)} ${f(top - 60 * h)} ${f(x - 30 * h)} ${f(top - 110 * h)} ${f(x - 58 * h)} ${f(top - 150 * h)}" stroke="${stems}" stroke-width="${f(2 * h)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${f(x - 18 * h)} ${f(top - 70 * h)}L${f(x + 22 * h)} ${f(top - 120 * h)}M${f(x - 36 * h)} ${f(top - 112 * h)}L${f(x - 10 * h)} ${f(top - 168 * h)}" stroke="${stems}" stroke-width="${f(1.4 * h)}" stroke-linecap="round"/>`;
  s += `<path d="M${f(x - 10 * h)} ${f(top)}H${f(x + 10 * h)}C${f(x + 12 * h)} ${f(top + 18 * h)} ${f(x + 32 * h)} ${f(top + 30 * h)} ${f(x + 32 * h)} ${f(y - 22 * h)}V${f(y)}H${f(x - 32 * h)}V${f(y - 22 * h)}C${f(x - 32 * h)} ${f(top + 30 * h)} ${f(x - 12 * h)} ${f(top + 18 * h)} ${f(x - 10 * h)} ${f(top)}Z" fill="${c.side(col)}"/>`;
  return s;
}

/* ----------------------------------------------------------------- sofas */

function sofaLegs(c, kind, x0, x1, yB, legH, inset, legCol) {
  if (kind === "plinth") return rect(x0 + 24, yB, x1 - x0 - 48, legH, 2, shade(legCol, -0.2));
  let s = "";
  for (const [x, dir] of [[x0 + inset, -1], [x1 - inset, 1]]) {
    if (kind === "taper") s += leg(x, yB, x + dir * 6, FY, 16, 9, c.side(legCol));
    if (kind === "metal") s += leg(x, yB, x + dir * 10, FY, 7, 4, legCol);
    if (kind === "block") s += rect(x - 14, yB, 28, legH, 3, c.side(legCol));
    if (kind === "bun") s += `<ellipse cx="${x}" cy="${yB + legH / 2}" rx="16" ry="${legH / 2}" fill="${c.side(legCol)}"/>`;
  }
  return s;
}

export function sofa(c, o) {
  const {
    width = 580, seats = 3, color, arm = "square", legs = "taper", legColor = "#6b4a32",
    back = "cushion", low = false, pillows = [],
  } = o;
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const legH = legs === "plinth" ? 10 : low ? 20 : 34;
  const yB = FY - legH;
  const deckH = low ? 40 : 48;
  const yDeck = yB - deckH;
  const cushH = low ? 44 : 50;
  const yS = yDeck - cushH + 8;
  const armW = arm === "track" ? 54 : 72;
  const armTop = yS - (low ? 22 : 44);
  const backTop = yS - (low ? 120 : 158);
  const dark = shade(color, -0.32);
  let s = sofaLegs(c, legs, x0, x1, yB, legH, armW * 0.45, legColor);

  // back
  const bx0 = x0 + armW - 16;
  const bx1 = x1 - armW + 16;
  const bh = yS - backTop + 24;
  if (back === "cushion") {
    const cw = (bx1 - bx0) / seats;
    for (let i = 0; i < seats; i++) {
      const bx = bx0 + i * cw + 3;
      const lift = i % 2 ? 6 : 0;
      s += rect(bx, backTop + lift, cw - 6, bh - lift, 28, c.soft(color, 0.16, -0.12));
      s += `<path d="M${f(bx + 22)} ${f(backTop + lift + 30)}Q${f(bx + cw / 2)} ${f(backTop + lift + 20)} ${f(bx + cw - 28)} ${f(backTop + lift + 30)}" stroke="${dark}" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
    }
  } else {
    s += rect(bx0, backTop, bx1 - bx0, bh, back === "tight" ? 34 : 22, c.soft(color, 0.14, -0.12));
    if (back === "tufted") {
      const rows = low ? 2 : 3;
      for (let rI = 0; rI < rows; rI++) {
        const y = backTop + 34 + rI * 38;
        const off = rI % 2 ? 24 : 0;
        for (let x = bx0 + 34 + off; x < bx1 - 24; x += 48) {
          s += `<path d="M${f(x - 18)} ${f(y - 14)}L${f(x)} ${f(y)}L${f(x + 18)} ${f(y - 14)}M${f(x - 18)} ${f(y + 14)}L${f(x)} ${f(y)}L${f(x + 18)} ${f(y + 14)}" stroke="${dark}" stroke-opacity=".28" stroke-width="1.6" fill="none"/>`;
          s += `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${dark}"/><circle cx="${f(x - 1)}" cy="${f(y - 1.4)}" r="1.2" fill="#fff" opacity=".35"/>`;
        }
      }
    }
    if (back === "channel") {
      for (let x = bx0 + 40; x < bx1 - 20; x += 44) {
        s += `<path d="M${f(x)} ${f(backTop + 16)}V${f(yS + 4)}" stroke="${dark}" stroke-opacity=".3" stroke-width="2.4"/>`;
        s += `<path d="M${f(x - 20)} ${f(backTop + 24)}V${f(yS - 6)}" stroke="#fff" stroke-opacity=".12" stroke-width="8" stroke-linecap="round"/>`;
      }
    }
  }

  // scatter cushions
  pillows.forEach((pc, i) => {
    const left = i % 2 === 0;
    const px = left ? bx0 + 20 + Math.floor(i / 2) * 60 : bx1 - 120 - Math.floor(i / 2) * 60;
    const rot = left ? -8 : 8;
    s += `<g transform="rotate(${rot} ${px + 50} ${yS - 40})"><path d="M${px} ${yS - 90}Q${px + 50} ${yS - 82} ${px + 100} ${yS - 90}Q${px + 92} ${yS - 40} ${px + 100} ${yS + 8}Q${px + 50} ${yS} ${px} ${yS + 8}Q${px + 8} ${yS - 40} ${px} ${yS - 90}Z" fill="${c.soft(pc, 0.14, -0.14)}"/></g>`;
  });

  // arms
  for (const side of [0, 1]) {
    const ax = side ? x1 - armW : x0;
    const fill = c.side(color);
    if (arm === "rolled") {
      s += `<path d="${topRound(ax, armTop + 18, armW, yB - armTop - 18, 10)}" fill="${fill}"/>`;
      const out = side ? 8 : -8;
      s += `<ellipse cx="${f(ax + armW / 2 + out)}" cy="${f(armTop + 22)}" rx="${armW / 2 + 9}" ry="26" fill="${c.soft(color, 0.16, -0.1)}"/>`;
      s += `<ellipse cx="${f(ax + armW / 2 + out)}" cy="${f(armTop + 24)}" rx="${armW / 2 - 8}" ry="15" fill="none" stroke="${dark}" stroke-opacity=".25" stroke-width="2"/>`;
    } else {
      const r = arm === "round" ? 36 : arm === "track" ? 8 : 16;
      s += `<path d="${topRound(ax, armTop, armW, yB - armTop, r)}" fill="${fill}"/>`;
      s += highlight(ax + 12, armTop + 6, ax + armW - 12, 0.22, 3);
    }
  }

  // deck + seat cushions
  s += rect(x0 + armW - 8, yDeck, width - armW * 2 + 16, deckH, 8, c.soft(shade(color, -0.07), 0.05, -0.18));
  const sx0 = x0 + armW - 4;
  const cw = (width - armW * 2 + 8) / seats;
  for (let i = 0; i < seats; i++) {
    const x = sx0 + i * cw + 2;
    s += rect(x, yS, cw - 4, cushH, 16, c.soft(shade(color, 0.05), 0.16, -0.14));
    s += highlight(x + 18, yS + 7, x + cw - 22, 0.3, 2.5);
    s += `<path d="M${f(x + 10)} ${f(yS + cushH - 8)}H${f(x + cw - 14)}" stroke="${dark}" stroke-opacity=".25" stroke-width="1.5"/>`;
  }
  return { svg: s, w: width };
}

export function ottoman(c, { color, legColor = "#1d1a18", width = 400 }) {
  const x0 = CX - width / 2;
  const legH = 26;
  const yB = FY - legH;
  const dark = shade(color, -0.4);
  let s = sofaLegs(c, "block", x0, x0 + width, yB, legH, 48, legColor);
  const bands = [[0, 70], [64, 62], [120, 58]];
  bands.forEach(([off, h], i) => {
    const inset = i * 6;
    const y = yB - off - h;
    s += rect(x0 + inset, y, width - inset * 2, h + 6, 22, c.soft(color, 0.2 - i * 0.03, -0.2));
    s += highlight(x0 + inset + 26, y + 8, x0 + width - inset - 26, 0.22, 3);
    s += `<path d="M${x0 + inset + 18} ${f(y + h - 6)}H${x0 + width - inset - 18}" stroke="${dark}" stroke-dasharray="5 5" stroke-opacity=".45" stroke-width="1.4"/>`;
  });
  return { svg: s, w: width };
}

/* ---------------------------------------------------------------- chairs */

/** Tub / shell armchair: fluted (channels) or tufted inner back. */
export function shellChair(c, o) {
  const { color, width = 360, tall = false, inner = "fluted", legColor = "#1c1a19", pillow } = o;
  const legH = 74;
  const yB = FY - legH;
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const cy = yB - (tall ? 210 : 170);
  const ry = tall ? 150 : 118;
  const dark = shade(color, -0.35);
  let s = "";
  // back legs then front legs
  s += leg(x0 + 120, yB - 6, x0 + 104, FY - 16, 7, 4, shade(legColor, 0.25));
  s += leg(x1 - 120, yB - 6, x1 - 104, FY - 16, 7, 4, shade(legColor, 0.25));
  s += leg(x0 + 64, yB - 8, x0 + 36, FY, 9, 5, legColor);
  s += leg(x1 - 64, yB - 8, x1 - 36, FY, 9, 5, legColor);
  // outer shell
  s += `<path d="M${x0} ${yB - 34}V${cy}A${width / 2} ${ry} 0 0 1 ${x1} ${cy}V${yB - 34}Q${x1} ${yB} ${x1 - 34} ${yB}H${x0 + 34}Q${x0} ${yB} ${x0} ${yB - 34}Z" fill="${c.side(color)}"/>`;
  // inner back
  const ix0 = x0 + 38;
  const ix1 = x1 - 38;
  const irx = width / 2 - 38;
  const iry = ry - 34;
  s += `<path d="M${ix0} ${yB - 80}V${cy}A${irx} ${iry} 0 0 1 ${ix1} ${cy}V${yB - 80}Z" fill="${c.soft(shade(color, -0.06), 0.06, -0.2)}"/>`;
  if (inner === "fluted") {
    for (let x = ix0 + 30; x < ix1 - 10; x += 34) {
      const t = (x - CX) / irx;
      const top = cy - iry * Math.sqrt(Math.max(0, 1 - t * t)) + 10;
      s += `<path d="M${f(x)} ${f(top)}V${yB - 96}" stroke="${dark}" stroke-opacity=".32" stroke-width="2.2"/>`;
      s += `<path d="M${f(x - 16)} ${f(top + 10)}V${yB - 110}" stroke="#fff" stroke-opacity=".1" stroke-width="10" stroke-linecap="round"/>`;
    }
  } else {
    for (let rI = 0; rI < (tall ? 4 : 3); rI++) {
      const y = cy - iry + 50 + rI * 46;
      const off = rI % 2 ? 26 : 0;
      for (let x = ix0 + 30 + off; x < ix1 - 20; x += 52) {
        const t = (x - CX) / irx;
        if (y < cy - iry * Math.sqrt(Math.max(0, 1 - t * t)) + 18) continue;
        s += `<path d="M${f(x - 22)} ${f(y - 18)}L${f(x)} ${f(y)}L${f(x + 22)} ${f(y - 18)}M${f(x - 22)} ${f(y + 18)}L${f(x)} ${f(y)}L${f(x + 22)} ${f(y + 18)}" stroke="${dark}" stroke-opacity=".3" stroke-width="1.6" fill="none"/>`;
        s += `<circle cx="${f(x)}" cy="${f(y)}" r="3.6" fill="${dark}"/>`;
      }
    }
  }
  if (pillow) {
    const py = cy + 10;
    s += `<g transform="rotate(-10 ${CX} ${py})"><path d="M${CX - 52} ${py - 52}Q${CX} ${py - 30} ${CX + 52} ${py - 52}Q${CX + 30} ${py} ${CX + 52} ${py + 52}Q${CX} ${py + 30} ${CX - 52} ${py + 52}Q${CX - 30} ${py} ${CX - 52} ${py - 52}Z" fill="${c.soft(pillow, 0.1, -0.12)}"/></g>`;
  }
  // seat cushion
  s += rect(x0 + 28, yB - 124, width - 56, 86, 34, c.soft(shade(color, 0.06), 0.18, -0.12));
  s += highlight(x0 + 60, yB - 116, x1 - 60, 0.3, 3);
  return { svg: s, w: width };
}

/** Moulded shell dining chair on splayed wooden legs (eames-style). */
export function diningShell(c, { color = "#161616", wood = "#b98d5f", width = 300 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const seatY = FY - 250;
  let s = "";
  s += leg(x0 + 86, seatY + 24, x0 + 70, FY - 24, 11, 8, shade(wood, -0.1), ` opacity=".85"`);
  s += leg(x1 - 86, seatY + 24, x1 - 70, FY - 24, 11, 8, shade(wood, -0.1), ` opacity=".85"`);
  s += `<path d="M${x0 + 50} ${seatY + 110}L${x1 - 80} ${seatY + 60}M${x1 - 50} ${seatY + 110}L${x0 + 80} ${seatY + 60}M${x0 + 50} ${seatY + 110}L${x1 - 50} ${seatY + 110}" stroke="#1a1a1a" stroke-width="2.5"/>`;
  s += leg(x0 + 58, seatY + 22, x0 + 18, FY, 13, 9, c.side(wood));
  s += leg(x1 - 58, seatY + 22, x1 - 18, FY, 13, 9, c.side(wood));
  s += rect(CX - 50, seatY + 18, 100, 22, 6, "#1d1d1d");
  const shellFill = c.lin([[0, shade(color, 0.3)], [0.35, color], [1, shade(color, -0.3)]], { x2: 1, y2: 0.4 });
  s += `<path d="M${CX - 92} ${seatY + 4}C${CX - 150} ${seatY - 70} ${CX - 150} ${seatY - 205} ${CX} ${seatY - 222}C${CX + 150} ${seatY - 205} ${CX + 150} ${seatY - 70} ${CX + 92} ${seatY + 4}Z" fill="${shellFill}"/>`;
  s += `<path d="M${CX - 98} ${seatY - 50}C${CX - 124} ${seatY - 110} ${CX - 112} ${seatY - 180} ${CX - 40} ${seatY - 200}" stroke="#fff" stroke-opacity=".28" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += rect(x0 + 2, seatY - 8, width - 4, 30, 15, c.soft(color, 0.2, -0.2));
  return { svg: s, w: width };
}

/** Wooden spindle-back dining chair with a fabric seat pad. */
export function spindleChair(c, { wood = "#6e4a33", seat = "#d8c4a5", width = 300 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const seatY = FY - 300;
  const top = seatY - 290;
  const wf = c.side(wood);
  let s = "";
  s += leg(x0 + 70, seatY + 30, x0 + 64, FY - 22, 14, 11, shade(wood, -0.15), ` opacity=".9"`);
  s += leg(x1 - 70, seatY + 30, x1 - 64, FY - 22, 14, 11, shade(wood, -0.15), ` opacity=".9"`);
  s += rect(x0 + 30, seatY + 150, width - 60, 12, 5, shade(wood, -0.1));
  // posts
  s += rect(x0 + 26, top, 22, seatY - top + 10, 10, wf);
  s += rect(x1 - 48, top, 22, seatY - top + 10, 10, wf);
  // spindles
  for (let i = 1; i <= 5; i++) {
    const x = x0 + 26 + (i * (width - 52)) / 6;
    s += rect(x - 5, top + 30, 10, seatY - top - 30, 5, wf);
  }
  s += `<path d="M${x0 + 18} ${top + 40}Q${CX} ${top - 6} ${x1 - 18} ${top + 40}L${x1 - 18} ${top + 74}Q${CX} ${top + 30} ${x0 + 18} ${top + 74}Z" fill="${c.soft(wood, 0.18, -0.12)}"/>`;
  // seat
  s += rect(x0 + 6, seatY, width - 12, 30, 10, c.soft(wood, 0.12, -0.15));
  s += rect(x0 + 16, seatY - 22, width - 32, 30, 14, c.soft(seat, 0.12, -0.14));
  s += highlight(x0 + 40, seatY - 15, x1 - 40, 0.35, 2.5);
  s += leg(x0 + 34, seatY + 28, x0 + 26, FY, 18, 13, wf);
  s += leg(x1 - 34, seatY + 28, x1 - 26, FY, 18, 13, wf);
  return { svg: s, w: width };
}

export function wingback(c, { color, legColor = "#5a3b28", width = 420 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const legH = 46;
  const yB = FY - legH;
  const dark = shade(color, -0.35);
  const top = yB - 470;
  let s = sofaLegs(c, "taper", x0, x1, yB, legH, 44, legColor);
  // back with wings
  s += `<path d="M${x0 + 40} ${yB - 150}C${x0 + 6} ${yB - 260} ${x0 + 20} ${top + 120} ${x0 + 70} ${top + 50}Q${CX} ${top - 20} ${x1 - 70} ${top + 50}C${x1 - 20} ${top + 120} ${x1 - 6} ${yB - 260} ${x1 - 40} ${yB - 150}Z" fill="${c.soft(color, 0.16, -0.12)}"/>`;
  s += `<path d="M${x0 + 100} ${yB - 160}V${top + 90}Q${CX} ${top + 30} ${x1 - 100} ${top + 90}V${yB - 160}Z" fill="${c.soft(shade(color, -0.06), 0.05, -0.16)}"/>`;
  s += `<path d="M${x0 + 72} ${top + 70}Q${CX} ${top + 2} ${x1 - 72} ${top + 70}" stroke="${dark}" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
  // rolled arms
  for (const side of [0, 1]) {
    const ax = side ? x1 - 82 : x0;
    s += `<path d="${topRound(ax, yB - 220, 82, 220, 12)}" fill="${c.side(color)}"/>`;
    s += `<ellipse cx="${ax + 41 + (side ? 6 : -6)}" cy="${yB - 214}" rx="50" ry="28" fill="${c.soft(color, 0.18, -0.1)}"/>`;
    s += `<ellipse cx="${ax + 41 + (side ? 6 : -6)}" cy="${yB - 212}" rx="30" ry="16" fill="none" stroke="${dark}" stroke-opacity=".28" stroke-width="2"/>`;
  }
  s += rect(x0 + 78, yB - 70, width - 156, 70, 8, c.soft(shade(color, -0.08), 0.04, -0.18));
  s += rect(x0 + 74, yB - 132, width - 148, 70, 20, c.soft(shade(color, 0.05), 0.18, -0.12));
  s += highlight(x0 + 100, yB - 124, x1 - 100, 0.3, 3);
  return { svg: s, w: width };
}

export function rattanLounge(c, { cane = "#c49a6c", cushion = "#e2ded7", width = 470 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const yB = FY - 40;
  const weave = c.pattern(
    `<rect width="14" height="14" fill="${cane}"/><path d="M0 7H14M7 0V14" stroke="${shade(cane, -0.25)}" stroke-width="1.6"/><circle cx="7" cy="7" r="2.6" fill="none" stroke="${shade(cane, 0.25)}" stroke-width="1.2"/>`,
    14, 14,
  );
  let s = "";
  s += leg(x0 + 70, yB, x0 + 50, FY, 18, 12, c.side(shade(cane, -0.2)));
  s += leg(x1 - 70, yB, x1 - 50, FY, 18, 12, c.side(shade(cane, -0.2)));
  const frame = `M${x0} ${yB - 30}V${yB - 250}Q${x0} ${yB - 380} ${CX} ${yB - 384}Q${x1} ${yB - 380} ${x1} ${yB - 250}V${yB - 30}Q${x1} ${yB} ${x1 - 30} ${yB}H${x0 + 30}Q${x0} ${yB} ${x0} ${yB - 30}Z`;
  s += `<path d="${frame}" fill="${weave}"/>`;
  s += `<path d="${frame}" fill="${c.lin([[0, "#fff", 0.15], [1, "#000", 0.22]])}" stroke="${shade(cane, -0.3)}" stroke-width="6"/>`;
  s += rect(x0 + 50, yB - 330, width - 100, 230, 50, c.soft(cushion, 0.1, -0.12));
  s += rect(x0 + 30, yB - 130, width - 60, 92, 34, c.soft(cushion, 0.12, -0.12));
  s += highlight(x0 + 70, yB - 120, x1 - 70, 0.4, 3);
  return { svg: s, w: width };
}

export function barStool(c, { seat = "#7a4a2c", metal = "#b48a4f" }) {
  const seatY = FY - 520;
  let s = "";
  s += leg(CX - 40, seatY + 30, CX - 60, FY - 18, 7, 6, shade(metal, -0.15), ` opacity=".85"`);
  s += leg(CX + 40, seatY + 30, CX + 60, FY - 18, 7, 6, shade(metal, -0.15), ` opacity=".85"`);
  s += `<ellipse cx="${CX}" cy="${FY - 200}" rx="112" ry="20" fill="none" stroke="${c.side(metal)}" stroke-width="8"/>`;
  s += leg(CX - 74, seatY + 30, CX - 128, FY, 9, 8, c.side(metal));
  s += leg(CX + 74, seatY + 30, CX + 128, FY, 9, 8, c.side(metal));
  s += `<ellipse cx="${CX}" cy="${seatY + 28}" rx="128" ry="22" fill="${shade(seat, -0.25)}"/>`;
  s += `<path d="M${CX - 130} ${seatY + 20}V${seatY}A130 30 0 0 1 ${CX + 130} ${seatY}V${seatY + 20}A130 26 0 0 1 ${CX - 130} ${seatY + 20}Z" fill="${c.soft(seat, 0.12, -0.2)}"/>`;
  s += `<ellipse cx="${CX}" cy="${seatY}" rx="130" ry="30" fill="${c.soft(seat, 0.25, 0)}"/>`;
  s += `<ellipse cx="${CX - 30}" cy="${seatY - 8}" rx="60" ry="9" fill="#fff" opacity=".18"/>`;
  return { svg: s, w: 280 };
}

/* ---------------------------------------------------------------- tables */

function veins(c, x0, x1, y0, y1, col, n = 7) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const sx = x0 + c.rand() * (x1 - x0);
    const sy = y0 + c.rand() * (y1 - y0);
    const ex = sx + (c.rand() - 0.3) * 260;
    const ey = sy + (c.rand() - 0.5) * (y1 - y0);
    s += `<path d="M${f(sx)} ${f(sy)}Q${f((sx + ex) / 2 + (c.rand() - 0.5) * 80)} ${f((sy + ey) / 2 + (c.rand() - 0.5) * 30)} ${f(ex)} ${f(ey)}" stroke="${col}" stroke-opacity="${f(0.2 + c.rand() * 0.35)}" stroke-width="${f(0.8 + c.rand() * 1.6)}" fill="none"/>`;
  }
  return s;
}

export function ovalCoffee(c, { stone = "#1c1b1c", vein = "#d8d2c8", inlay = "#b88a4e", width = 620 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const topY = FY - 190;
  const rx = width / 2;
  let s = "";
  s += rect(CX - 150, topY + 40, 110, FY - topY - 40, 6, c.side(stone));
  s += rect(CX + 20, topY + 54, 130, FY - topY - 54, 6, c.side(shade(stone, 0.08)));
  s += veins(c, CX - 150, CX + 150, topY + 60, FY - 10, vein, 5);
  s += `<path d="M${x0} ${topY}A${rx} 44 0 0 0 ${x1} ${topY}V${topY + 30}A${rx} 44 0 0 1 ${x0} ${topY + 30}Z" fill="${c.soft(stone, 0.05, -0.3)}"/>`;
  const clip = c.id("clip");
  c.defs.push(`<clipPath id="${clip}"><ellipse cx="${CX}" cy="${topY}" rx="${rx}" ry="44"/></clipPath>`);
  s += `<ellipse cx="${CX}" cy="${topY}" rx="${rx}" ry="44" fill="${c.lin([[0, shade(stone, 0.18)], [1, stone]], { x2: 1, y2: 1 })}"/>`;
  s += `<g clip-path="url(#${clip})">${veins(c, x0, x1, topY - 44, topY + 44, vein, 11)}</g>`;
  s += `<ellipse cx="${CX + 10}" cy="${topY}" rx="96" ry="13" fill="${c.lin([[0, shade(inlay, 0.3)], [1, shade(inlay, -0.2)]], { x2: 1, y2: 0 })}"/>`;
  s += `<ellipse cx="${CX - 120}" cy="${topY - 18}" rx="140" ry="8" fill="#fff" opacity=".12"/>`;
  s += books(c, CX - 170, topY + 6, ["#6f5d4d", "#d4cec4"]);
  return { svg: s, w: width };
}

export function diningTable(c, { wood = "#c49a6c", width = 660, decor = true }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const topY = FY - 320;
  let s = "";
  s += leg(x0 + 110, topY + 50, x0 + 110, FY - 24, 26, 18, shade(wood, -0.18), ` opacity=".9"`);
  s += leg(x1 - 110, topY + 50, x1 - 110, FY - 24, 26, 18, shade(wood, -0.18), ` opacity=".9"`);
  s += `<polygon points="${x0 + 34},${topY - 34} ${x1 - 34},${topY - 34} ${x1},${topY} ${x0},${topY}" fill="${c.lin([[0, shade(wood, 0.1)], [1, shade(wood, 0.28)]])}"/>`;
  for (let i = 0; i < 6; i++) {
    const y = topY - 30 + i * 5;
    s += `<path d="M${x0 + 40 + i * 4} ${y}Q${CX} ${y + (i % 2 ? 2 : -2)} ${x1 - 40 - i * 4} ${y}" stroke="${shade(wood, -0.15)}" stroke-opacity=".25" fill="none"/>`;
  }
  s += rect(x0, topY, width, 30, 4, c.soft(wood, 0.04, -0.2));
  s += rect(x0 + 44, topY + 30, width - 88, 30, 2, shade(wood, -0.22));
  s += leg(x0 + 58, topY + 30, x0 + 58, FY, 34, 22, c.side(wood));
  s += leg(x1 - 58, topY + 30, x1 - 58, FY, 34, 22, c.side(wood));
  if (decor) {
    s += vase(c, CX + 40, topY - 14, { col: "#c9c4bc", stems: "#9b7b55", h: 1.1 });
    s += `<ellipse cx="${CX - 140}" cy="${topY - 18}" rx="56" ry="10" fill="#e4d8c6"/><ellipse cx="${CX - 140}" cy="${topY - 22}" rx="44" ry="7" fill="#f4ede2"/>`;
  }
  return { svg: s, w: width };
}

export function pedestalSide(c, { stone = "#d9c7aa" }) {
  const topY = FY - 270;
  let s = "";
  s += `<path d="M${CX - 84} ${topY + 40}Q${CX - 64} ${(topY + FY) / 2} ${CX - 92} ${FY - 16}H${CX + 92}Q${CX + 64} ${(topY + FY) / 2} ${CX + 84} ${topY + 40}Z" fill="${c.side(stone)}"/>`;
  for (let i = 0; i < 26; i++) {
    const x = CX - 70 + c.rand() * 140;
    const y = topY + 50 + c.rand() * (FY - topY - 70);
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2 + c.rand() * 4)}" ry="${f(1 + c.rand() * 1.5)}" fill="${shade(stone, -0.3)}" opacity=".35"/>`;
  }
  s += `<ellipse cx="${CX}" cy="${FY - 14}" rx="120" ry="16" fill="${shade(stone, -0.15)}"/>`;
  s += rect(CX - 120, FY - 28, 240, 16, 8, c.soft(stone, 0.05, -0.2));
  s += `<path d="M${CX - 170} ${topY}A170 28 0 0 0 ${CX + 170} ${topY}V${topY + 36}A170 28 0 0 1 ${CX - 170} ${topY + 36}Z" fill="${c.soft(stone, 0, -0.22)}"/>`;
  s += `<ellipse cx="${CX}" cy="${topY}" rx="170" ry="28" fill="${c.soft(stone, 0.2, 0.02)}"/>`;
  s += vase(c, CX + 60, topY + 2, { col: "#3b3430", stems: "#b08958", h: 0.85 });
  s += books(c, CX - 70, topY + 4, ["#4b5246", "#d4cec4"]);
  return { svg: s, w: 340 };
}

export function archConsole(c, { wood = "#7a5236", width = 620 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const topY = FY - 340;
  let s = "";
  for (const px of [x0 + 14, x1 - 134]) {
    const outer = `M${px} ${FY}V${topY + 22}H${px + 120}V${FY}Z`;
    const hole = `M${px + 22} ${FY}V${topY + 110}A38 38 0 0 1 ${px + 98} ${topY + 110}V${FY}Z`;
    s += `<path d="${outer} ${hole}" fill-rule="evenodd" fill="${c.side(wood)}"/>`;
  }
  s += rect(x0 + 120, FY - 110, width - 240, 22, 3, c.soft(wood, 0.1, -0.2));
  s += books(c, CX + 20, FY - 110, ["#2f3b45", "#6f5d4d", "#d4cec4", "#4b5246"], { upright: true });
  s += rect(x0, topY, width, 24, 4, c.soft(wood, 0.12, -0.2));
  s += `<polygon points="${x0 + 22},${topY - 16} ${x1 - 22},${topY - 16} ${x1},${topY} ${x0},${topY}" fill="${shade(wood, 0.22)}"/>`;
  s += tableLamp(c, x0 + 130, topY - 12, {});
  s += vase(c, x1 - 120, topY - 12, { col: "#6f5d4d", stems: "#8a6a4f", h: 0.9 });
  return { svg: s, w: width };
}

export function nestingTables(c, { metal = "#1f1d1b", glass = "#cfd8d6" }) {
  let s = "";
  const big = { cx: CX - 50, top: FY - 250, rx: 180 };
  const small = { cx: CX + 120, top: FY - 175, rx: 120 };
  for (const t of [big, small]) {
    s += leg(t.cx - t.rx + 34, t.top + 10, t.cx - t.rx + 40, FY - 14, 5, 5, shade(metal, 0.2), ` opacity=".7"`);
    s += leg(t.cx + t.rx - 34, t.top + 10, t.cx + t.rx - 40, FY - 14, 5, 5, shade(metal, 0.2), ` opacity=".7"`);
    s += leg(t.cx - t.rx + 14, t.top + 10, t.cx - t.rx + 14, FY, 7, 7, metal);
    s += leg(t.cx + t.rx - 14, t.top + 10, t.cx + t.rx - 14, FY, 7, 7, metal);
    s += `<ellipse cx="${t.cx}" cy="${t.top + 12}" rx="${t.rx - 6}" ry="${t.rx * 0.15}" fill="none" stroke="${metal}" stroke-width="7"/>`;
    s += `<ellipse cx="${t.cx}" cy="${t.top}" rx="${t.rx}" ry="${t.rx * 0.16}" fill="${glass}" fill-opacity=".55" stroke="${shade(glass, -0.25)}" stroke-width="3"/>`;
    s += `<ellipse cx="${t.cx - t.rx * 0.3}" cy="${t.top - 4}" rx="${t.rx * 0.35}" ry="4" fill="#fff" opacity=".5"/>`;
  }
  s += vase(c, big.cx - 30, big.top + 2, { col: "#c9c4bc", stems: "#5e6657", h: 0.8 });
  s += `<circle cx="${small.cx + 10}" cy="${small.top - 22}" r="20" fill="${c.rad([[0, "#d8d3cb"], [1, "#8d877f"]], { fx: 0.35, fy: 0.3 })}"/>`;
  return { svg: s, w: 520 };
}

export function roundDining(c, { top = "#e7dccb", base = "#6f5d4d" }) {
  const topY = FY - 330;
  let s = "";
  s += `<path d="M${CX - 34} ${topY + 40}C${CX - 30} ${FY - 160} ${CX - 150} ${FY - 60} ${CX - 150} ${FY - 10}H${CX + 150}C${CX + 150} ${FY - 60} ${CX + 30} ${FY - 160} ${CX + 34} ${topY + 40}Z" fill="${c.side(base)}"/>`;
  s += `<ellipse cx="${CX}" cy="${FY - 10}" rx="150" ry="12" fill="${shade(base, -0.2)}"/>`;
  s += `<path d="M${CX - 270} ${topY}A270 44 0 0 0 ${CX + 270} ${topY}V${topY + 28}A270 44 0 0 1 ${CX - 270} ${topY + 28}Z" fill="${c.soft(top, 0, -0.22)}"/>`;
  s += `<ellipse cx="${CX}" cy="${topY}" rx="270" ry="44" fill="${c.soft(top, 0.2, 0)}"/>`;
  s += vase(c, CX + 20, topY + 4, { col: "#3b3430", stems: "#9b7b55", h: 1 });
  s += `<path d="M${CX - 196} ${topY - 2}Q${CX - 150} ${topY + 34} ${CX - 104} ${topY - 2}Z" fill="${c.side("#3a3836")}"/>`;
  return { svg: s, w: 560 };
}

/* ------------------------------------------------------------------ beds */

export function bed(c, o) {
  const {
    width = 640, headboard = "channel", hb = "#cbb79b", frame = "#cbb79b", frameWood = false,
    duvet = "#f4efe7", throwCol = "#6f5d4d", pillows = ["#ffffff", "#d4cec4"], low = false,
  } = o;
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const legH = low ? 8 : 18;
  const yB = FY - legH;
  const frameTop = yB - (low ? 90 : 110);
  const hbTop = FY - (headboard === "panel" ? 470 : 590);
  const hbBottom = frameTop + 10;
  let s = "";

  // headboard
  if (headboard === "channel") {
    s += rect(x0 + 10, hbTop, width - 20, hbBottom - hbTop, 34, c.soft(hb, 0.12, -0.14));
    for (let x = x0 + 52; x < x1 - 30; x += 44) {
      s += `<path d="M${x} ${hbTop + 16}V${hbBottom - 6}" stroke="${shade(hb, -0.3)}" stroke-opacity=".35" stroke-width="2.4"/>`;
      s += `<path d="M${x - 22} ${hbTop + 26}V${hbBottom - 14}" stroke="#fff" stroke-opacity=".14" stroke-width="12" stroke-linecap="round"/>`;
    }
  } else if (headboard === "arch") {
    s += `<path d="M${x0 + 30} ${hbBottom}V${hbTop + 140}C${x0 + 30} ${hbTop - 10} ${x1 - 30} ${hbTop - 10} ${x1 - 30} ${hbTop + 140}V${hbBottom}Z" fill="${c.soft(hb, 0.14, -0.14)}"/>`;
    s += `<path d="M${x0 + 56} ${hbBottom}V${hbTop + 150}C${x0 + 56} ${hbTop + 24} ${x1 - 56} ${hbTop + 24} ${x1 - 56} ${hbTop + 150}V${hbBottom}" stroke="${shade(hb, -0.3)}" stroke-opacity=".35" stroke-width="2.4" fill="none"/>`;
  } else if (headboard === "slat") {
    s += rect(x0 + 10, hbTop, width - 20, 30, 6, c.soft(hb, 0.14, -0.12));
    for (let x = x0 + 18; x < x1 - 30; x += 38) s += rect(x, hbTop + 26, 26, hbBottom - hbTop - 26, 4, c.side(hb));
  } else if (headboard === "cane") {
    const cane = c.pattern(
      `<rect width="18" height="18" fill="#c9bfae"/><path d="M0 0L18 18M18 0L0 18M9 0V18M0 9H18" stroke="#b8935f" stroke-width="1.3"/><circle cx="9" cy="9" r="3" fill="#c9bfae" stroke="#b8935f"/>`,
      18, 18,
    );
    s += rect(x0 + 10, hbTop, width - 20, hbBottom - hbTop, 18, c.soft(hb, 0.12, -0.16));
    s += rect(x0 + 40, hbTop + 30, width - 80, hbBottom - hbTop - 50, 10, cane);
    s += rect(x0 + 40, hbTop + 30, width - 80, hbBottom - hbTop - 50, 10, c.lin([[0, "#fff", 0.1], [1, "#000", 0.18]]));
  } else {
    s += rect(x0 + 10, hbTop, width - 20, hbBottom - hbTop, 18, c.soft(hb, 0.12, -0.14));
  }

  // frame + legs
  s += sofaLegs(c, frameWood ? "block" : "bun", x0, x1, yB, legH, 40, shade(frame, -0.35));
  s += rect(x0, frameTop, width, yB - frameTop, frameWood ? 6 : 18, frameWood ? c.soft(frame, 0.1, -0.2) : c.soft(frame, 0.12, -0.16));
  if (!frameWood) s += highlight(x0 + 20, frameTop + 8, x1 - 20, 0.25, 3);

  // pillows
  const pw = (width - 120) / 2;
  pillows.forEach((pc, i) => {
    const px = x0 + 50 + i * (pw + 20);
    s += `<path d="M${px} ${frameTop - 150}Q${px + pw / 2} ${frameTop - 168} ${px + pw} ${frameTop - 150}Q${px + pw + 8} ${frameTop - 110} ${px + pw} ${frameTop - 76}H${px}Q${px - 8} ${frameTop - 110} ${px} ${frameTop - 150}Z" fill="${c.soft(pc, 0.08, -0.12)}"/>`;
  });
  if (pillows.length === 2) {
    s += `<path d="M${CX - 70} ${frameTop - 118}Q${CX} ${frameTop - 128} ${CX + 70} ${frameTop - 118}Q${CX + 76} ${frameTop - 96} ${CX + 70} ${frameTop - 72}H${CX - 70}Q${CX - 76} ${frameTop - 96} ${CX - 70} ${frameTop - 118}Z" fill="${c.soft(throwCol, 0.12, -0.12)}"/>`;
  }

  // duvet: top surface then front fall
  s += `<polygon points="${x0 + 30},${frameTop - 92} ${x1 - 30},${frameTop - 92} ${x1 - 6},${frameTop - 52} ${x0 + 6},${frameTop - 52}" fill="${c.lin([[0, shade(duvet, -0.06)], [1, shade(duvet, 0.04)]])}"/>`;
  s += `<path d="M${x0 + 6} ${frameTop - 52}H${x1 - 6}V${frameTop + 34}Q${x1 - 60} ${frameTop + 50} ${CX + 120} ${frameTop + 38}T${CX - 80} ${frameTop + 42}T${x0 + 6} ${frameTop + 34}Z" fill="${c.soft(duvet, 0.05, -0.12)}"/>`;
  // folded throw
  s += `<path d="M${x0 + 4} ${frameTop - 40}H${x1 - 4}V${frameTop + 4}H${x0 + 4}Z" fill="${c.soft(throwCol, 0.12, -0.16)}"/>`;
  s += highlight(x0 + 16, frameTop - 34, x1 - 16, 0.22, 2);
  s += `<path d="M${x0 + 6} ${frameTop + 6}H${x1 - 6}" stroke="${shade(throwCol, -0.35)}" stroke-opacity=".4" stroke-width="2"/>`;
  return { svg: s, w: width };
}

/* ---------------------------------------------------------------- office */

export function taskChair(c, { fabric = "#3c3c40", base = "#141414" }) {
  const seatY = FY - 330;
  let s = "";
  // star base
  const hubY = FY - 96;
  const legsTo = [[CX - 196, FY - 44], [CX + 196, FY - 44], [CX - 70, FY - 26], [CX + 80, FY - 24]];
  legsTo.forEach(([x, y]) => {
    s += `<path d="M${CX} ${hubY}L${x} ${y}" stroke="${base}" stroke-width="16" stroke-linecap="round"/>`;
    s += `<circle cx="${x}" cy="${FY - 18}" r="18" fill="${c.side("#2a2a2a")}"/><rect x="${x - 6}" y="${y - 2}" width="12" height="18" fill="${base}"/>`;
  });
  s += `<path d="M${CX} ${hubY}L${CX} ${FY - 52}" stroke="${base}" stroke-width="16" stroke-linecap="round"/>`;
  s += `<circle cx="${CX}" cy="${FY - 18}" r="16" fill="#2a2a2a" opacity=".8"/>`;
  s += rect(CX - 12, seatY + 20, 24, hubY - seatY - 20, 6, c.side("#9a9a9a"));
  s += rect(CX - 20, hubY - 70, 40, 74, 10, c.side("#1c1c1c"));
  // back support + back
  s += rect(CX - 18, seatY - 130, 36, 150, 8, base);
  s += `<path d="M${CX - 150} ${seatY - 70}C${CX - 170} ${seatY - 220} ${CX - 150} ${seatY - 330} ${CX} ${seatY - 336}C${CX + 150} ${seatY - 330} ${CX + 170} ${seatY - 220} ${CX + 150} ${seatY - 70}Q${CX} ${seatY - 40} ${CX - 150} ${seatY - 70}Z" fill="${c.soft(fabric, 0.18, -0.2)}"/>`;
  const knit = c.pattern(`<rect width="6" height="6" fill="none"/><path d="M0 3H6" stroke="#fff" stroke-opacity=".05"/>`, 6, 6);
  s += `<path d="M${CX - 150} ${seatY - 70}C${CX - 170} ${seatY - 220} ${CX - 150} ${seatY - 330} ${CX} ${seatY - 336}C${CX + 150} ${seatY - 330} ${CX + 170} ${seatY - 220} ${CX + 150} ${seatY - 70}Q${CX} ${seatY - 40} ${CX - 150} ${seatY - 70}Z" fill="${knit}"/>`;
  s += `<path d="M${CX - 110} ${seatY - 270}Q${CX} ${seatY - 310} ${CX + 100} ${seatY - 276}" stroke="#fff" stroke-opacity=".16" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  // seat
  s += rect(CX - 168, seatY - 18, 336, 52, 24, c.soft(fabric, 0.2, -0.22));
  s += highlight(CX - 130, seatY - 10, CX + 130, 0.2, 3);
  return { svg: s, w: 420 };
}

export function writingDesk(c, { wood = "#6e4a33", width = 620 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const topY = FY - 330;
  let s = "";
  s += leg(x0 + 70, topY + 24, x0 + 76, FY - 26, 20, 13, shade(wood, -0.2), ` opacity=".9"`);
  s += leg(x1 - 70, topY + 24, x1 - 76, FY - 26, 20, 13, shade(wood, -0.2), ` opacity=".9"`);
  s += `<polygon points="${x0 + 28},${topY - 28} ${x1 - 28},${topY - 28} ${x1},${topY} ${x0},${topY}" fill="${shade(wood, 0.22)}"/>`;
  s += rect(x0, topY, width, 26, 3, c.soft(wood, 0.08, -0.2));
  s += rect(CX - 150, topY + 26, 300, 60, 3, c.soft(shade(wood, -0.05), 0.06, -0.18));
  s += rect(CX - 40, topY + 52, 80, 6, 3, "#c8a46a");
  s += leg(x0 + 34, topY + 26, x0 + 40, FY, 24, 15, c.side(wood));
  s += leg(x1 - 34, topY + 26, x1 - 40, FY, 24, 15, c.side(wood));
  // desk lamp
  const lx = x0 + 110;
  s += `<ellipse cx="${lx + 80}" cy="${topY - 140}" rx="100" ry="70" fill="${c.rad([[0, "#ffe9c4", 0.45], [1, "#ffe9c4", 0]])}"/>`;
  s += `<ellipse cx="${lx}" cy="${topY - 30}" rx="34" ry="7" fill="#2b2622"/>`;
  s += `<path d="M${lx} ${topY - 32}L${lx + 30} ${topY - 170}L${lx + 110} ${topY - 190}" stroke="#2b2622" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
  s += `<path d="M${lx + 92} ${topY - 214}L${lx + 140} ${topY - 168}L${lx + 108} ${topY - 150}Z" fill="#2b2622"/>`;
  s += books(c, CX + 70, topY - 28, ["#6f5d4d", "#2f3b45", "#d4cec4"]);
  s += `<g transform="translate(${x1 - 80 - (x1 - 80) * 0.45} ${(topY - 28) - FY * 0.45}) scale(0.45)">${plant(c, x1 - 80, { pot: "#c9c4bc" })}</g>`;
  return { svg: s, w: width };
}

export function standingDesk(c, { top = "#c49a6c", frame = "#1d1c1b", width = 620 }) {
  const x0 = CX - width / 2;
  const x1 = CX + width / 2;
  const topY = FY - 430;
  let s = "";
  for (const x of [x0 + 90, x1 - 90]) {
    s += rect(x - 22, topY + 20, 44, FY - topY - 34, 4, c.side(frame));
    s += rect(x - 26, topY + 150, 52, 8, 2, shade(frame, 0.2));
    s += rect(x - 80, FY - 18, 160, 18, 6, frame);
  }
  s += rect(x0 + 90, topY + 40, width - 180, 16, 3, shade(frame, 0.12));
  s += `<polygon points="${x0 + 26},${topY - 28} ${x1 - 26},${topY - 28} ${x1},${topY} ${x0},${topY}" fill="${shade(top, 0.24)}"/>`;
  s += rect(x0, topY, width, 24, 4, c.soft(top, 0.06, -0.2));
  // monitor
  s += rect(CX + 10, topY - 72, 20, 52, 3, "#2a2a2a");
  s += rect(CX - 50, topY - 32, 140, 10, 4, "#2a2a2a");
  s += rect(CX - 120, topY - 250, 280, 180, 10, "#181818");
  s += rect(CX - 110, topY - 240, 260, 160, 6, c.lin([[0, "#3a4a52"], [1, "#6f5d4d"]], { x2: 1, y2: 1 }));
  s += `<path d="M${CX - 110} ${topY - 120}Q${CX} ${topY - 180} ${CX + 150} ${topY - 140}V${topY - 80}H${CX - 110}Z" fill="#2f3b45" opacity=".5"/>`;
  s += `<g transform="translate(${x0 + 90 - (x0 + 90) * 0.4} ${(topY - 28) - FY * 0.4}) scale(0.4)">${plant(c, x0 + 90, { pot: "#6f5d4d" })}</g>`;
  s += rect(x1 - 120, topY - 64, 44, 50, 8, "#c9c4bc");
  s += `<path d="M${x1 - 76} ${topY - 54}q24 4 0 26" stroke="#c9c4bc" stroke-width="7" fill="none"/>`;
  return { svg: s, w: width };
}

export function ladderShelf(c, { wood = "#c49a6c" }) {
  const top = FY - 690;
  const levels = 5;
  let s = "";
  const lx = (y, side) => {
    const t = (y - top) / (FY - top);
    return side ? CX + 120 + t * 70 : CX - 120 - t * 70;
  };
  const objs = [
    () => "",
    (x0, x1, y) => books(c, x0 + 20, y, ["#2f3b45", "#6f5d4d", "#d4cec4", "#5e6657", "#b88a4e"], { upright: true }) + vase(c, x1 - 50, y, { col: "#6f5d4d", stems: "#8a6a4f", h: 0.6 }),
    (x0, x1, y) => `<circle cx="${x0 + 60}" cy="${y - 34}" r="34" fill="${c.rad([[0, "#e2ded7"], [1, "#b8a789"]], { fx: 0.35, fy: 0.3 })}"/>` + books(c, x1 - 90, y, ["#d4cec4", "#3c3c40", "#6f5d4d"]),
    (x0, x1, y) => books(c, x0 + 26, y, ["#b88a4e", "#d4cec4", "#4b5246", "#2f3b45", "#6f5d4d", "#b3a48d"], { upright: true }),
    (x0, x1, y) => `<g transform="translate(${CX - CX * 0.5} ${y - FY * 0.5}) scale(0.5)">${plant(c, CX, { pot: "#c9c4bc" })}</g>`,
  ];
  for (let i = levels - 1; i >= 0; i--) {
    const y = top + 90 + i * ((FY - top - 110) / (levels - 1));
    const x0 = lx(y, 0) + 8;
    const x1 = lx(y, 1) - 8;
    s += objs[levels - 1 - i](x0, x1, y);
    s += rect(x0 - 6, y, x1 - x0 + 12, 16, 3, c.soft(wood, 0.15, -0.18));
  }
  s += `<path d="M${lx(top, 0)} ${top}L${lx(FY, 0)} ${FY}" stroke="${shade(wood, -0.08)}" stroke-width="20" stroke-linecap="round"/>`;
  s += `<path d="M${lx(top, 1)} ${top}L${lx(FY, 1)} ${FY}" stroke="${shade(wood, -0.08)}" stroke-width="20" stroke-linecap="round"/>`;
  s += `<path d="M${lx(top, 0) - 4} ${top + 6}L${lx(FY, 0) - 4} ${FY - 6}" stroke="#fff" stroke-opacity=".25" stroke-width="4"/>`;
  s += `<path d="M${lx(top, 1) - 4} ${top + 6}L${lx(FY, 1) - 4} ${FY - 6}" stroke="#fff" stroke-opacity=".25" stroke-width="4"/>`;
  return { svg: s, w: 400 };
}

export function executiveChair(c, { leather = "#7a4a2c", base = "#b9b9b9" }) {
  const seatY = FY - 300;
  let s = "";
  const hubY = FY - 90;
  [[CX - 200, FY - 40], [CX + 200, FY - 40], [CX - 74, FY - 24], [CX + 84, FY - 22]].forEach(([x, y]) => {
    s += `<path d="M${CX} ${hubY}L${x} ${y}" stroke="${c.side(base)}" stroke-width="15" stroke-linecap="round"/>`;
    s += `<circle cx="${x}" cy="${FY - 18}" r="18" fill="#222"/>`;
  });
  s += rect(CX - 12, seatY + 40, 24, hubY - seatY - 40, 6, c.side(base));
  const dark = shade(leather, -0.35);
  const backTop = seatY - 420;
  s += `<path d="${topRound(CX - 160, backTop, 320, 420, 80, 30)}" fill="${c.soft(leather, 0.18, -0.16)}"/>`;
  for (let i = 1; i < 7; i++) {
    const y = backTop + 30 + i * 52;
    s += `<path d="M${CX - 140} ${y}Q${CX} ${y + 8} ${CX + 140} ${y}" stroke="${dark}" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
    s += `<path d="M${CX - 120} ${y - 26}Q${CX} ${y - 20} ${CX + 120} ${y - 26}" stroke="#fff" stroke-opacity=".12" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  }
  for (const side of [-1, 1]) {
    const ax = CX + side * 190;
    s += `<path d="M${ax} ${seatY + 30}V${seatY - 110}" stroke="${c.side(base)}" stroke-width="10"/>`;
    s += rect(ax - 40, seatY - 136, 80, 34, 16, c.soft(leather, 0.16, -0.2));
  }
  s += rect(CX - 186, seatY - 30, 372, 70, 30, c.soft(leather, 0.2, -0.2));
  s += highlight(CX - 140, seatY - 20, CX + 140, 0.25, 3);
  return { svg: s, w: 460 };
}

/* ------------------------------------------------------------------ scene */

const DRAWERS = {
  sofa, ottoman, shellChair, diningShell, spindleChair, wingback, rattanLounge, barStool,
  ovalCoffee, diningTable, pedestalSide, archConsole, nestingTables, roundDining,
  bed, taskChair, writingDesk, standingDesk, ladderShelf, executiveChair,
};

/**
 * Architectural backdrop shared by product shots and room scenes.
 * cx/span mark the feature wall area (panel or slats) behind the furniture.
 */
function backdrop(c, p, { w, fy, cx, span }) {
  const wall = c.lin([[0, p.top], [1, p.bottom]]);
  let s = `<rect width="${w}" height="${fy}" fill="${wall}"/>`;
  const x0 = cx - span / 2;

  if (p.wall === "fluted") {
    for (let x = -10; x < w; x += 22) s += `<rect x="${x}" y="0" width="22" height="${fy}" fill="${c.flute}"/>`;
  } else if (p.wall === "panel") {
    const top = fy * 0.16;
    s += `<rect x="${f(x0)}" y="${f(top)}" width="${f(span)}" height="${f(fy - top - 16)}" fill="${shade(p.bottom, -0.035)}"/>`;
    s += `<path d="M${f(x0)} ${f(fy - 16)}V${f(top)}H${f(x0 + span)}" stroke="#000" stroke-opacity="${p.dark ? 0.35 : 0.1}" stroke-width="4" fill="none"/>`;
    s += `<path d="M${f(x0 + span)} ${f(top)}V${f(fy - 16)}" stroke="#fff" stroke-opacity="${p.dark ? 0.06 : 0.5}" stroke-width="3"/>`;
  } else if (p.wall === "slats") {
    const top = fy * 0.08;
    s += `<rect x="${f(x0)}" y="${f(top)}" width="${f(span)}" height="${f(fy - top)}" fill="${shade(p.wood, -0.45)}"/>`;
    const slat = c.lin([[0, shade(p.wood, -0.12)], [0.5, shade(p.wood, 0.1)], [1, shade(p.wood, -0.18)]], { x2: 1, y2: 0 });
    for (let x = x0 + 4; x + 22 <= x0 + span; x += 30) {
      s += `<rect x="${f(x)}" y="${f(top)}" width="22" height="${f(fy - top)}" fill="${slat}"/>`;
    }
    s += `<rect x="${f(x0)}" y="${f(top)}" width="${f(span)}" height="${f(fy - top)}" fill="${c.lin([[0, "#000", 0.25], [0.5, "#000", 0], [1, "#000", 0.1]])}"/>`;
  }

  // Daylight from a tall window on the left, falling across the wall.
  const lightOp = p.dark ? 0.05 : 0.22;
  const lw = w * 0.11;
  const lx = w * 0.12;
  let light = "";
  for (let i = 0; i < 2; i++) {
    const a = lx + i * (lw + w * 0.018);
    const b = a + lw;
    const yTop = fy * 0.12;
    light += `<polygon points="${f(a)},${f(yTop + a * 0.16)} ${f(b)},${f(yTop + b * 0.16)} ${f(b + fy * 0.42)},${f(fy)} ${f(a + fy * 0.42)},${f(fy)}" fill="#fff" opacity="${lightOp}"/>`;
  }
  s += `<g filter="url(#soft)">${light}</g>`;
  s += `<rect width="${w}" height="${fy}" fill="${c.rad([[0, "#fff", p.dark ? 0.06 : 0.35], [1, "#fff", 0]], { cx: 0.2, cy: 0.1, r: 0.8 })}"/>`;
  return s;
}

function floorAndSkirting(c, p, { w, h, fy, cx }) {
  let s = `<rect y="${fy}" width="${w}" height="${h - fy}" fill="${c.lin([[0, p.floorCol[0]], [1, p.floorCol[1]]])}"/>`;
  const depth = h - fy;
  if (p.floor === "planks") {
    const r = c.rand;
    const top = 34;
    const bot = top * 1.9;
    const n = Math.ceil(w / top);
    for (let k = -n; k <= n; k++) {
      const xt = cx + k * top;
      const xb = cx + k * bot;
      s += `<path d="M${f(xt)} ${fy}L${f(xb)} ${h}" stroke="#000" stroke-opacity="${p.dark ? 0.35 : 0.14}" stroke-width="1.2"/>`;
      // a butt joint somewhere along each board
      const t = 0.15 + r() * 0.7;
      const xa = xt + (xb - xt) * t;
      const step = top + (bot - top) * t;
      s += `<path d="M${f(xa)} ${f(fy + depth * t)}h${f(step)}" stroke="#000" stroke-opacity="${p.dark ? 0.3 : 0.1}" stroke-width="1"/>`;
    }
    s += `<rect y="${fy}" width="${w}" height="${depth}" fill="${c.lin([[0, "#fff", 0], [0.5, "#fff", p.dark ? 0.03 : 0.08], [1, "#fff", 0]], { x2: 1, y2: 0 })}"/>`;
  } else {
    s += `<rect y="${fy}" width="${w}" height="${depth}" filter="url(#mottle)" opacity=".5"/>`;
    s += `<path d="M0 ${f(fy + depth * 0.55)}H${w}" stroke="#000" stroke-opacity=".08" stroke-width="1.5"/>`;
  }
  // window light continuing across the floor
  s += `<g filter="url(#soft)"><polygon points="${f(w * 0.26)},${fy} ${f(w * 0.5)},${fy} ${f(w * 0.78)},${h} ${f(w * 0.38)},${h}" fill="#fff" opacity="${p.dark ? 0.03 : 0.12}"/></g>`;
  // ambient occlusion where the floor meets the wall, then the skirting board
  s += `<rect y="${fy}" width="${w}" height="40" fill="${c.lin([[0, "#000", p.dark ? 0.35 : 0.12], [1, "#000", 0]])}"/>`;
  s += `<rect y="${fy - 18}" width="${w}" height="18" fill="${p.skirt}"/>`;
  s += `<rect y="${fy - 18}" width="${w}" height="2" fill="#fff" opacity="${p.dark ? 0.05 : 0.6}"/>`;
  return s;
}

function svgDefs(c, p) {
  return `<defs>${c.defs.join("")}<filter id="blur" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="12"/></filter><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter><filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .05" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .35 0"/></filter><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${p.dark ? ".08" : ".05"} 0"/></filter></defs>`;
}

function prepare(c, p) {
  // Fluted plaster: one gradient reused for every flute.
  c.flute = c.lin([[0, "#000", p.dark ? 0.18 : 0.06], [0.5, "#fff", p.dark ? 0.03 : 0.22], [1, "#000", p.dark ? 0.12 : 0.04]], { x2: 1, y2: 0 });
}

function contactShadow(x, y, half, s, dark) {
  return `<ellipse cx="${f(x)}" cy="${f(y + 8 * s)}" rx="${f(half + 30 * s)}" ry="${f(22 * s)}" fill="#000" opacity="${dark ? 0.5 : 0.24}" filter="url(#blur)"/>`
    + `<ellipse cx="${f(x)}" cy="${f(y + 2 * s)}" rx="${f(half - 10 * s)}" ry="${f(6 * s)}" fill="#000" opacity="${dark ? 0.5 : 0.22}"/>`;
}

/**
 * Render a full scene: backdrop + furniture + decor.
 * spec: { kind, opts, palette, decor: ["plant-left" | "plant-right" | "lamp-left" | "lamp-right" | "art"] }
 */
export function renderScene(spec, seed, paletteName = spec.palette) {
  const p = PALETTES[paletteName];
  const c = makeCtx(seed);
  prepare(c, p);
  const piece = DRAWERS[spec.kind](c, spec.opts ?? {});
  const decor = spec.decor ?? [];
  const half = piece.w / 2;

  let back = "";
  if (decor.includes("art")) back += wallArt(c, { dark: p.dark, tone: spec.accent ?? "#8f7d69", y: 130, w: 210, h: 270 });
  if (decor.includes("lamp-left")) back += floorLamp(c, Math.max(90, CX - half - 70), { dir: 1 });
  if (decor.includes("lamp-right")) back += floorLamp(c, Math.min(710, CX + half + 70), { dir: -1 });
  // Plants stand behind the piece so leaves never cover it.
  if (decor.includes("plant-left")) back += plant(c, Math.max(84, CX - half - 40), { pot: spec.pot ?? "#3a3836" });
  if (decor.includes("plant-right")) back += plant(c, Math.min(716, CX + half + 40), { pot: spec.pot ?? "#c9c4bc" });

  const wallSvg = backdrop(c, p, { w: W, fy: FY, cx: CX, span: 520 });
  const floorSvg = floorAndSkirting(c, p, { w: W, h: H, fy: FY, cx: CX });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
${svgDefs(c, p)}
${wallSvg}
${back}
${floorSvg}
${contactShadow(CX, FY, half, 1, p.dark)}
${piece.svg}
<rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`;
}

/* ------------------------------------------------------------------ rooms */

export const RW = 1600;
export const RH = 1000;
const RFY = 760; // floor line in a room scene

/** Place something drawn around (CX, FY) at room position x, scaled by s. */
function place(svg, x, s = 1, dy = 0) {
  return `<g transform="translate(${f(x - CX * s)} ${f(RFY + dy - FY * s)}) scale(${s})">${svg}</g>`;
}

/**
 * Render a wide room scene (1600 × 1000) with several catalogue pieces.
 * Keep the main pieces between x = 300 and 1300 so the scene survives
 * cropping to 1:1, 4:3, 16:9 and 21:9 frames.
 *
 * spec: {
 *   palette, feature: { x, w }, rug: { x, w, col }, accent,
 *   items: [
 *     { piece: <catalogue art spec>, x, s, dy },   // furniture, drawn in order (later = in front)
 *     { decor: "plant" | "lamp" | "lampR" | "art", x, s, y, pot, tone },
 *   ]
 * }
 */
export function renderRoom(spec, seed) {
  const p = PALETTES[spec.palette];
  const c = makeCtx(seed);
  prepare(c, p);
  let back = "";
  let pieces = "";

  for (const it of spec.items) {
    const s = it.s ?? 1;
    const dy = it.dy ?? 0;
    if (it.decor === "art") {
      back += `<g transform="translate(${f(it.x - CX * s)} ${f((it.y ?? 120) - 150 * s)}) scale(${s})">${wallArt(c, { dark: p.dark, tone: it.tone ?? spec.accent ?? "#8f7d69", w: it.w ?? 230, h: it.h ?? 290 })}</g>`;
    } else if (it.decor === "lamp" || it.decor === "lampR") {
      back += place(floorLamp(c, CX, { dir: it.decor === "lamp" ? 1 : -1 }), it.x, s, dy);
    } else if (it.decor === "plant") {
      back += place(plant(c, CX, { pot: it.pot ?? "#3a3836", h: 1 }), it.x, s, dy);
    } else if (it.piece) {
      const piece = DRAWERS[it.piece.kind](c, it.piece.opts ?? {});
      // Each shadow sits above the pieces behind it.
      pieces += contactShadow(it.x, RFY + dy, (piece.w / 2) * s, s, p.dark) + place(piece.svg, it.x, s, dy);
    }
  }

  const ft = spec.feature ?? { x: RW / 2, w: 820 };
  let rug = "";
  if (spec.rug) {
    const { x, w, col = "#d9d4cc" } = spec.rug;
    const y0 = RFY + 18;
    const y1 = RFY + 160;
    const spread = 80;
    const shape = `M${f(x - w / 2)} ${y0}H${f(x + w / 2)}L${f(x + w / 2 + spread)} ${y1}H${f(x - w / 2 - spread)}Z`;
    rug += `<path d="${shape}" fill="${c.lin([[0, shade(col, -0.05)], [1, shade(col, 0.04)]])}"/>`;
    rug += `<path d="${shape}" filter="url(#mottle)" opacity=".25"/>`;
    rug += `<path d="M${f(x - w / 2 - spread)} ${y1}H${f(x + w / 2 + spread)}" stroke="#000" stroke-opacity=".12" stroke-width="3"/>`;
  }

  // Build the backdrop first: it registers gradients that <defs> must include.
  const wallSvg = backdrop(c, p, { w: RW, fy: RFY, cx: ft.x, span: ft.w });
  const floorSvg = floorAndSkirting(c, p, { w: RW, h: RH, fy: RFY, cx: RW / 2 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RW} ${RH}" width="${RW}" height="${RH}" preserveAspectRatio="xMidYMid slice">
${svgDefs(c, p)}
${wallSvg}
${back}
${floorSvg}
${rug}
${pieces}
<rect width="${RW}" height="${RH}" filter="url(#grain)"/>
</svg>`;
}
