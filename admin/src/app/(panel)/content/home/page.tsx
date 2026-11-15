import type { Metadata } from "next";
import { BlockForm, type BlockSection } from "@/components/panel/block-form";
import { LastSaved } from "@/components/panel/last-saved";
import { PageTitle } from "@/components/panel/page-title";
import { saveHomeAction } from "@/lib/actions/content";
import { requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/data/content";

export const metadata: Metadata = { title: "Home page" };

const sections: BlockSection[] = [
  {
    title: "Headline",
    description: "Three short lines. The second line gets a small room picture after it; the third is in the accent style.",
    fields: [
      { name: "eyebrow", label: "Small text above", optional: true, wide: true, maxLength: 80 },
      { name: "line1", label: "Line 1", maxLength: 40 },
      { name: "line2", label: "Line 2", maxLength: 40 },
      { name: "line3", label: "Line 3 (accent)", maxLength: 40 },
      { name: "sentence", label: "Sentence under the headline", type: "textarea", optional: true, maxLength: 300 },
    ],
  },
  {
    title: "Buttons",
    description: "Links can be a page of the shop (/shop, /ar/live, /shop?category=sofa) or a full https:// address.",
    fields: [
      { name: "primaryLabel", label: "Main button text", maxLength: 40 },
      { name: "primaryHref", label: "Main button link", type: "url" },
      { name: "secondaryLabel", label: "Second button text", optional: true, hint: "Leave empty to hide it.", maxLength: 40 },
      { name: "secondaryHref", label: "Second button link", type: "url", optional: true },
    ],
  },
];

export default async function HomeContentPage() {
  await requireAdmin();
  const block = await getBlock("home");

  return (
    <div>
      <PageTitle title="Home page" description={<LastSaved at={block.updatedAt} by={block.updatedBy} />} />
      <BlockForm action={saveHomeAction} sections={sections} values={block.data} />
    </div>
  );
}
