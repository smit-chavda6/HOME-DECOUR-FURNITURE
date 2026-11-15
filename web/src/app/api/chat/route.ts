import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data/orders";
import {
  getCatalogue,
  getProductsBySlugs,
  type CatalogueEntry,
} from "@/lib/data/products";
import { askGemini } from "@/lib/gemini";
import { orderStatusLabel } from "@/lib/order-status";
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

/** Shopping assistant. POST { message, history } -> { reply, products }. */

const bodySchema = z.object({
  message: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "bot"]),
        text: z.string().max(1200),
      }),
    )
    .max(8)
    .default([]),
});

const replySchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    products: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["reply", "products"],
};

function systemPrompt(catalogue: CatalogueEntry[], orderNotes: string) {
  const lines = catalogue
    .map(
      (p) =>
        `${p.slug} | ${p.name} | ${p.category} | Rs ${p.price} | ${p.material || "-"} | ${p.size || "-"} | rating ${p.rating} | ${p.inStock ? "in stock" : "out of stock"}${p.has3d ? " | 3D/AR" : ""}`,
    )
    .join("\n");

  return `You are the shopping assistant for ${site.name}, an online furniture store in ${site.contact.address}.

Rules:
- Answer only about this store: its furniture, orders, delivery, returns, payments and the AR preview. Politely decline anything else.
- Recommend only products from the CATALOGUE below and never invent names, prices or stock.
- Reply in the customer's language (English, Hindi or Hinglish). Keep replies short: two to four sentences, plain text, no markdown.
- Put the slugs of the products you recommend (at most 4, best first) in "products". Do not repeat their prices in "reply"; product cards are shown under your message.
- If nothing fits, say so and suggest a nearby option or category.

Store facts:
- Delivery: most orders arrive in 7 to 14 business days. Shipping is Rs ${SHIPPING_FEE}; free on orders of Rs ${FREE_SHIPPING_FROM} or more. Prices exclude 18% GST.
- Returns: unused, undamaged items within 7 days of delivery. Custom-made items may differ.
- Payment: cash on delivery, and online payment where offered at checkout.
- AR: products marked 3D/AR can be placed in the customer's room from the AR page on a phone.
- Support: ${site.contact.phone}, ${site.contact.email}.
${orderNotes ? `\nThis customer's recent orders:\n${orderNotes}\n` : "\nThe customer is not signed in, so you cannot see orders. Ask them to log in and open Account > Orders for order status.\n"}
CATALOGUE (slug | name | category | price | material | size | rating | stock):
${lines}`;
}

/** Used when the AI service is not configured or fails: simple keyword matching. */
function keywordFallback(message: string, catalogue: CatalogueEntry[]) {
  const words = message.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  const budget = Number(message.replace(/,/g, "").match(/\d{4,7}/)?.[0] ?? 0);

  const matches = catalogue
    .filter((p) => p.inStock && (!budget || p.price <= budget))
    .map((p) => {
      const haystack = `${p.name} ${p.category} ${p.material}`.toLowerCase();
      const score = words.filter((w) => haystack.includes(w.replace(/s$/, ""))).length;
      return { p, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
    .slice(0, 4)
    .map((m) => m.p.slug);

  return matches.length
    ? { reply: "Here are some pieces that match what you described.", products: matches }
    : {
        reply: `I could not find a match for that. Try a category like sofa, chair, table, bed or office, or reach us at ${site.contact.phone}.`,
        products: [],
      };
}

export async function POST(request: Request) {
  if (!(await rateLimit(`chat:${await clientIp()}`, 20, 60))) {
    return Response.json(
      { error: "You are sending messages very quickly. Please wait a moment." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Please type a message." }, { status: 400 });
  }
  const { message, history } = parsed.data;

  const catalogue = await getCatalogue();

  // Only a signed-in customer's own orders are ever shared with the assistant.
  let orderNotes = "";
  const user = await getCurrentUser();
  if (user && /order|track|deliver|status|parcel|shipment/i.test(message)) {
    const orders = (await getOrdersForUser(user.id)).slice(0, 3);
    orderNotes = orders
      .map(
        (o) =>
          `Order ${o.id.slice(-8).toUpperCase()} placed ${o.createdAt.slice(0, 10)}: ${orderStatusLabel[o.status] ?? o.status}, total ${formatPrice(o.total)}, items: ${o.lines.map((l) => l.name).join(", ")}`,
      )
      .join("\n");
    if (!orderNotes) orderNotes = "No orders yet.";
  }

  const raw = await askGemini({
    system: systemPrompt(catalogue, orderNotes),
    messages: [
      ...history.map((h) => ({
        role: h.role === "bot" ? ("model" as const) : ("user" as const),
        parts: [{ text: h.text }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ],
    jsonSchema: replySchema,
  });

  let answer: { reply: string; products: string[] } | null = null;
  if (raw) {
    try {
      const data = JSON.parse(raw) as { reply?: unknown; products?: unknown };
      if (typeof data.reply === "string" && data.reply.trim()) {
        answer = {
          reply: data.reply.trim(),
          products: Array.isArray(data.products)
            ? data.products.filter((s): s is string => typeof s === "string").slice(0, 4)
            : [],
        };
      }
    } catch {
      // Not valid JSON: fall through to the keyword fallback.
    }
  }
  answer ??= keywordFallback(message, catalogue);

  const products = await getProductsBySlugs(answer.products);
  return Response.json({ reply: answer.reply, products });
}
