import type { ProductDetail } from "@/lib/data/products";

/** A 3D product as the AR room needs it. */
export type ArProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  modelUrl: string;
  /** Real width in metres, used to show the piece at true size. */
  widthMetres: number;
  inStock: boolean;
};

/** Typical widths when a product has no dimensions saved, in metres. */
const DEFAULT_WIDTH: Record<string, number> = {
  sofa: 2.0,
  chair: 0.7,
  table: 1.0,
  bed: 1.9,
  office: 1.2,
};

/** Guess from the name first ("Sofa Chair" is saved as a sofa but is chair-sized). */
const NAME_WIDTH: [RegExp, number][] = [
  [/stool|ottoman|pouf/i, 0.6],
  [/chair|armchair/i, 0.8],
  [/side table|bedside/i, 0.5],
  [/desk/i, 1.2],
  [/table/i, 1.0],
];

function defaultWidth(p: ProductDetail) {
  const byName = NAME_WIDTH.find(([pattern]) => pattern.test(p.name));
  return byName ? byName[1] : (DEFAULT_WIDTH[p.category] ?? 1);
}

export function toArProduct(p: ProductDetail): ArProduct {
  const cm = p.dimensions ? Math.max(p.dimensions.length, p.dimensions.width) : 0;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.image,
    modelUrl: p.modelUrl!,
    widthMetres: cm > 10 ? cm / 100 : defaultWidth(p),
    inStock: p.inStock,
  };
}
