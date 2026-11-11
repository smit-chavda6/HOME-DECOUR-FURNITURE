/** Site-wide content that more than one component needs. */

export const site = {
  name: "Home Decor Furniture",
  tagline: "HomeSphere AR: see it in your room before you buy.",
  description:
    "Furniture for modern living. Preview pieces in 3D and place them in your own room with AR before you buy.",
  contact: {
    address: "Ahmedabad, Gujarat, India",
    phone: "+91 9825000000",
    email: "support@homedecorfurniture.com",
  },
} as const;

/** Public address of the site, used for absolute links (sitemap, social previews). */
export function siteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

export const mainNav = [
  { label: "Shop", href: "/shop" },
  { label: "AR Studio", href: "/ar" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Categories that exist in the product database, in display order. */
export const categories = [
  {
    slug: "sofa",
    label: "Sofas",
    blurb: "Home & living",
    image: "image/product/Royal Crest Chesterfield Sofa (Leather Sofa).jpg",
  },
  {
    slug: "chair",
    label: "Chairs",
    blurb: "Sitting focus",
    image: "image/product/CurveLounge™ Designer Accent Chair.webp",
  },
  {
    slug: "table",
    label: "Tables",
    blurb: "Dining & coffee",
    image: "image/product/LunaNest™ Round Coffee Table.webp",
  },
  {
    slug: "bed",
    label: "Beds",
    blurb: "Rest & sleep",
    image: "image/product/bedroom.jpg",
  },
  {
    slug: "office",
    label: "Office",
    blurb: "Work & study",
    image: "image/product/NordEdge™ Solid Wood Study Desk.webp",
  },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
