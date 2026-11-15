import type { Metadata } from "next";
import { BlockForm, type BlockSection } from "@/components/panel/block-form";
import { LastSaved } from "@/components/panel/last-saved";
import { PageHero } from "@/components/panel/ui";
import { Megaphone } from "lucide-react";
import { saveBannerAction } from "@/lib/actions/content";
import { requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/data/content";

export const metadata: Metadata = { title: "Announcement" };

const sections: BlockSection[] = [
  {
    title: "Message",
    icon: "megaphone",
    fields: [
      { name: "enabled", label: "Show the announcement bar", type: "checkbox", hint: "a strip above the header on every page" },
      { name: "text", label: "Message", wide: true, placeholder: "Diwali sale: 20% off all sofas this week", maxLength: 160 },
      { name: "linkLabel", label: "Link text", optional: true, placeholder: "Shop sofas", maxLength: 40 },
      { name: "href", label: "Link", type: "url", optional: true, placeholder: "/shop?category=sofa" },
    ],
  },
  {
    title: "Dates",
    icon: "calendar",
    description: "Optional. The bar only shows between these days (inclusive). Leave empty to show it until you switch it off.",
    fields: [
      { name: "startsAt", label: "From", type: "date", optional: true },
      { name: "endsAt", label: "Until", type: "date", optional: true },
    ],
  },
];

export default async function BannerPage() {
  await requireAdmin();
  const block = await getBlock("banner");

  return (
    <div className="rise">
      <PageHero icon={Megaphone} eyebrow="Website · announcement" title="Say it at" accent="the top" description={<LastSaved at={block.updatedAt} by={block.updatedBy} />} />
      <BlockForm action={saveBannerAction} sections={sections} values={block.data} preview="banner" />
    </div>
  );
}
