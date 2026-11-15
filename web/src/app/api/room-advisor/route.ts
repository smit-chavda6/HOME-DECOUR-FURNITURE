import { getCatalogue, getProductsBySlugs } from "@/lib/data/products";
import { askGemini, isGeminiEnabled } from "@/lib/gemini";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Room advisor. The visitor uploads a photo of their room; the AI describes
 * the space and picks matching products from the catalogue.
 * POST multipart form: image (file), notes (optional text).
 */

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const resultSchema = {
  type: "OBJECT",
  properties: {
    isRoom: { type: "BOOLEAN" },
    summary: { type: "STRING" },
    style: { type: "STRING" },
    palette: { type: "ARRAY", items: { type: "STRING" } },
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          slug: { type: "STRING" },
          reason: { type: "STRING" },
        },
        required: ["slug", "reason"],
      },
    },
  },
  required: ["isRoom", "summary", "style", "palette", "recommendations"],
};

function json(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!isGeminiEnabled()) {
    return json("The room advisor is not switched on yet. You can still place 3D models in your room below.", 503);
  }
  if (!(await rateLimit(`room:${await clientIp()}`, 8, 10 * 60))) {
    return json("You have analysed several rooms already. Please try again in a few minutes.", 429);
  }

  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof File)) return json("Please choose a photo of your room.", 400);
  if (!ALLOWED.has(image.type)) return json("Please use a JPG, PNG or WebP photo.", 400);
  if (image.size > MAX_BYTES) return json("That photo is too large. Please use one under 4 MB.", 400);
  const notes = String(form?.get("notes") ?? "").trim().slice(0, 300);

  const catalogue = (await getCatalogue()).filter((p) => p.inStock);
  const lines = catalogue
    .map(
      (p) =>
        `${p.slug} | ${p.name} | ${p.category} | Rs ${p.price} | ${p.material || "-"} | ${p.colors.join("/") || "-"} | ${p.size || "-"}`,
    )
    .join("\n");

  const raw = await askGemini({
    system: `You are an interior stylist for a furniture store. Look at the customer's room photo and choose furniture from the CATALOGUE that suits it.

Rules:
- If the photo does not show a room or indoor space, set "isRoom" to false, explain briefly in "summary" and return no recommendations.
- "summary": two sentences describing the room (size impression, light, what is already there).
- "style": a short label such as "Warm minimal" or "Classic".
- "palette": three to five plain colour names you see in the room.
- "recommendations": three or four products from the CATALOGUE, different categories where it makes sense. "slug" must be copied exactly. "reason": one sentence on why it suits THIS room (colour, scale, material).
- Never invent products. Write in plain English without markdown.

CATALOGUE (slug | name | category | price | material | colours | size):
${lines}`,
    messages: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: image.type,
              data: Buffer.from(await image.arrayBuffer()).toString("base64"),
            },
          },
          { text: notes ? `Customer notes: ${notes}` : "Suggest furniture for this room." },
        ],
      },
    ],
    jsonSchema: resultSchema,
    temperature: 0.4,
    maxOutputTokens: 900,
  });

  if (!raw) return json("The advisor could not read that photo right now. Please try again.", 502);

  try {
    const data = JSON.parse(raw) as {
      isRoom: boolean;
      summary: string;
      style: string;
      palette: string[];
      recommendations: { slug: string; reason: string }[];
    };

    const picks = (data.recommendations ?? []).slice(0, 4);
    const products = await getProductsBySlugs(picks.map((r) => r.slug));

    return Response.json({
      isRoom: Boolean(data.isRoom),
      summary: String(data.summary ?? ""),
      style: String(data.style ?? ""),
      palette: (data.palette ?? []).slice(0, 5).map(String),
      // Keep only picks that are real products, with their reason attached.
      recommendations: products.map((product) => ({
        product,
        reason: picks.find((r) => r.slug === product.slug)?.reason ?? "",
      })),
    });
  } catch {
    return json("The advisor gave an unreadable answer. Please try again.", 502);
  }
}
