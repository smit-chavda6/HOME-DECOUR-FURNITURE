/** Written content for the FAQ and blog. Edit here; the pages update automatically. */

export const faqGroups = [
  {
    title: "Orders and delivery",
    items: [
      {
        q: "How do I place an order?",
        a: "Add pieces to your cart and check out with your delivery address. For custom furniture, contact us first so we can agree the details before you order.",
      },
      {
        q: "How long does delivery take?",
        a: "Most ready-to-ship orders arrive within 7 to 14 business days. Custom pieces can take longer depending on production and your location.",
      },
      {
        q: "How much is shipping?",
        a: "Shipping is ₹499 per order and free on orders of ₹50,000 or more. Prices on the site exclude 18% GST, which is added at checkout.",
      },
      {
        q: "Do you assemble the furniture?",
        a: "Yes. Our delivery team assembles eligible furniture in serviceable areas and places it where you want it.",
      },
      {
        q: "How do I track my order?",
        a: "Log in and open Account, then Orders. Each order shows its current status, from placed to delivered.",
      },
    ],
  },
  {
    title: "Products and materials",
    items: [
      {
        q: "What materials do you use?",
        a: "Responsibly sourced solid and engineered wood, durable upholstery fabrics and leather, quality foams, tempered glass and metal hardware. Each product page lists its exact material.",
      },
      {
        q: "How do I care for my furniture?",
        a: "Wipe surfaces with a soft dry or slightly damp cloth, keep pieces out of strong direct sunlight, and use coasters. Vacuum upholstery regularly and clean spills straight away.",
      },
      {
        q: "How does the AR preview work?",
        a: "Products marked 3D can be rotated on any device. On an Android phone or iPhone, open the AR page or the product's 3D view and tap “View in your room” to place it on your floor at real size.",
      },
    ],
  },
  {
    title: "Customisation",
    items: [
      {
        q: "Can I order custom furniture?",
        a: "Yes. We can adjust dimensions, colours, finishes, fabrics and some design details. Send your idea through the contact page and we will reply with feasibility, price and timing.",
      },
    ],
  },
  {
    title: "Returns and payment",
    items: [
      {
        q: "What is your return policy?",
        a: "Unused, undamaged items can be returned within 7 days of delivery, after inspection. Custom-made pieces may have different conditions.",
      },
      {
        q: "How can I pay?",
        a: "Cash on delivery is available on every order. Where offered at checkout, you can also pay online by UPI, card, net banking or wallet through Razorpay.",
      },
      {
        q: "How do I contact support?",
        a: "Use the contact page, email support@homedecorfurniture.com or call +91 9825000000, Monday to Saturday.",
      },
    ],
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingMinutes: number;
  image: string;
  body: { heading?: string; text: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "choosing-the-perfect-sofa",
    title: "Five tips for choosing the perfect sofa",
    excerpt: "The sofa anchors your living room. Here is how to get the size, fabric and comfort right the first time.",
    date: "2026-09-18",
    readingMinutes: 4,
    image: "image/rooms/living.svg",
    body: [
      { text: "A sofa is the piece you use every day and see every time you walk into the room, so it is worth choosing slowly. These five checks cover most of what matters." },
      { heading: "1. Measure the room, then the doorway", text: "Leave about 45 cm between the sofa and a coffee table, and at least 75 cm for walkways. Then measure the doors, stairs and lift the sofa must pass through on delivery day." },
      { heading: "2. Match the depth to how you sit", text: "A seat depth around 55 cm suits upright sitting and shorter people; 60 cm or more is better for curling up. If you can, try the AR preview to see the full footprint in your room." },
      { heading: "3. Pick fabric for your life, not the showroom", text: "Tightly woven fabrics and leather handle children and pets well. Velvet looks rich but shows marks. Lighter colours brighten small rooms but need more care." },
      { heading: "4. Check the frame and cushions", text: "Solid or engineered hardwood frames last longest. High-resilience foam keeps its shape; feather blends feel softer but need regular plumping." },
      { heading: "5. Plan the colour around what stays", text: "Choose the sofa colour after your floor and walls, and add bolder colour through cushions and throws you can change later." },
    ],
  },
  {
    slug: "sustainable-materials",
    title: "Sustainable materials in modern furniture",
    excerpt: "How responsibly sourced wood, recycled metal and durable finishes make furniture better for your home and the planet.",
    date: "2026-08-02",
    readingMinutes: 3,
    image: "image/rooms/dining.svg",
    body: [
      { text: "The most sustainable piece of furniture is the one you keep for decades. That starts with materials chosen to last." },
      { heading: "Wood from managed sources", text: "Certified and reclaimed timber keeps forests healthy. Engineered wood made from offcuts uses more of every tree and resists warping." },
      { heading: "Metal that can be reused", text: "Steel and aluminium can be recycled again and again without losing strength, which makes them a good choice for legs and frames." },
      { heading: "Finishes that protect", text: "Water-based lacquers and natural oils release fewer fumes and protect the surface, so the piece ages well instead of being replaced." },
    ],
  },
  {
    slug: "caring-for-wooden-furniture",
    title: "How to care for wooden furniture",
    excerpt: "Simple habits that keep wood looking beautiful for years.",
    date: "2026-06-21",
    readingMinutes: 3,
    image: "image/rooms/study.svg",
    body: [
      { text: "Wood is a natural material that reacts to light, heat and moisture. A little care goes a long way." },
      { heading: "Dust often, clean gently", text: "Use a soft dry cloth weekly. For marks, a cloth barely damp with mild soap and water, then dry straight away." },
      { heading: "Mind the sun and heat", text: "Strong direct sunlight fades wood, and heaters or AC vents can dry it out and cause cracks. Move pieces a little away from both." },
      { heading: "Use coasters and mats", text: "Hot cups and wet glasses leave rings that are hard to remove. Coasters and placemats prevent them." },
      { heading: "Polish now and then", text: "Every few months, a wax or oil suited to your finish restores the sheen and adds a protective layer." },
    ],
  },
  {
    slug: "home-decor-trends",
    title: "Home decor trends worth trying",
    excerpt: "Warm neutrals, natural textures and furniture that works harder: the ideas shaping homes right now.",
    date: "2026-05-10",
    readingMinutes: 3,
    image: "image/rooms/lounge.svg",
    body: [
      { text: "Trends come and go, but the best ones make a home calmer and more comfortable. These are easy to adopt a little at a time." },
      { heading: "Warm, earthy neutrals", text: "Clay, sand, olive and walnut tones replace stark grey and white, and make rooms feel lived in." },
      { heading: "Curves and soft shapes", text: "Rounded sofas, arched mirrors and curved chairs soften straight-lined rooms." },
      { heading: "Mixed natural textures", text: "Combine wood, linen, boucle, rattan and stone. Texture adds interest without adding colour." },
      { heading: "Furniture that multitasks", text: "Storage beds, extendable tables and compact desks help smaller homes do more." },
    ],
  },
];
