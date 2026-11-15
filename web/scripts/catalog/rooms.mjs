/**
 * Wide room scenes for editorial spots (about page, home story, blog covers).
 * Every piece comes from the catalogue, so the rooms show things we sell.
 */
import { products } from "./catalog.mjs";

const art = (name) => {
  const p = products.find((x) => x.name === name);
  if (!p) throw new Error(`Unknown product: ${name}`);
  return p.art;
};

export const rooms = {
  // Light living room: linen sofa, marble coffee table, travertine side table.
  living: {
    palette: "sand", feature: { x: 800, w: 820 }, rug: { x: 800, w: 900 },
    items: [
      { decor: "art", x: 800, y: 130, s: 0.95 },
      { decor: "lamp", x: 330, s: 1 },
      { decor: "plant", x: 1290, s: 1.05, pot: "#c9c4bc" },
      { piece: art("Linen Cloud 3-Seater Sofa"), x: 800, s: 1.05 },
      { piece: art("Pebble Travertine Side Table"), x: 1180, s: 0.85 },
      { piece: art("Noir Marble Coffee Table"), x: 800, s: 0.75, dy: 100 },
    ],
  },
  // Warm leather corner for "craft".
  leather: {
    palette: "ochre", feature: { x: 760, w: 780 }, accent: "#6b3a22",
    items: [
      { decor: "art", x: 760, y: 120, s: 0.9, tone: "#6b3a22" },
      { piece: art("Ladder Bookshelf"), x: 1250, s: 0.86 },
      { decor: "plant", x: 330, s: 1.1, pot: "#c9c4bc" },
      { piece: art("Heritage Chesterfield Sofa"), x: 760, s: 1.05 },
      { piece: art("Saddle Leather Ottoman"), x: 760, s: 0.68, dy: 100 },
    ],
  },
  // Sage study with desk, chair, shelf.
  study: {
    palette: "sage", feature: { x: 760, w: 740 },
    items: [
      { decor: "lamp", x: 1180, s: 1 },
      { piece: art("Ladder Bookshelf"), x: 330, s: 0.86 },
      { piece: art("Walnut Writing Desk"), x: 780, s: 1.05 },
      { piece: art("Atlas Ergonomic Task Chair"), x: 820, s: 0.72, dy: 70 },
      { decor: "plant", x: 1330, s: 0.95, dy: 30, pot: "#c9c4bc" },
    ],
  },
  // Dining room with oak table and spindle chairs.
  dining: {
    palette: "clay", feature: { x: 800, w: 820 }, rug: { x: 800, w: 1000, col: "#f1e6d8" },
    items: [
      { decor: "art", x: 800, y: 110, s: 0.85 },
      { decor: "plant", x: 300, s: 1.1 },
      { decor: "lampR", x: 1310, s: 1 },
      { piece: art("Walnut Spindle Dining Chair"), x: 560, s: 0.78 },
      { piece: art("Walnut Spindle Dining Chair"), x: 1040, s: 0.78 },
      { piece: art("Oakline Dining Table"), x: 800, s: 1.1, dy: 30 },
    ],
  },
  // Soft, curvy lounge for the trends post.
  lounge: {
    palette: "blush", feature: { x: 760, w: 760 }, rug: { x: 780, w: 860, col: "#f4e9e2" },
    items: [
      { decor: "lamp", x: 330, s: 1 },
      { decor: "plant", x: 1330, s: 1, pot: "#c9c4bc" },
      { piece: art("Sage Curve Loveseat"), x: 700, s: 1.1 },
      { piece: art("Pebble Travertine Side Table"), x: 1010, s: 0.8 },
      { piece: art("Cloud Tufted Accent Chair"), x: 1170, s: 0.8, dy: 30 },
    ],
  },
  // Terracotta living room for the brand values panel.
  terracotta: {
    palette: "sand", feature: { x: 820, w: 800 }, rug: { x: 820, w: 900, col: "#ece2d2" },
    items: [
      { decor: "art", x: 820, y: 120, s: 0.95, tone: "#b8603f" },
      { decor: "plant", x: 330, s: 1.15, pot: "#c9c4bc" },
      { piece: art("Arc Walnut Console Table"), x: 1330, s: 0.72 },
      { piece: art("Terracotta Boucle Sofa"), x: 820, s: 1.05 },
      { piece: art("Duo Nesting Tables"), x: 820, s: 0.68, dy: 100 },
    ],
  },
};
