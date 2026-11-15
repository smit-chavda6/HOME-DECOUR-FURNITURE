import type { Metadata } from "next";
import { BlockForm, type BlockSection } from "@/components/panel/block-form";
import { LastSaved } from "@/components/panel/last-saved";
import { PageHero } from "@/components/panel/ui";
import { Settings } from "lucide-react";
import { saveSettingsAction } from "@/lib/actions/content";
import { requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/data/content";

export const metadata: Metadata = { title: "Store settings" };

const sections: BlockSection[] = [
  {
    title: "Store",
    icon: "store",
    fields: [
      { name: "name", label: "Store name", maxLength: 80 },
      { name: "tagline", label: "Tagline", optional: true, maxLength: 160 },
      { name: "description", label: "Short description", type: "textarea", optional: true, maxLength: 300 },
    ],
  },
  {
    title: "Contact details",
    icon: "phone",
    description: "Shown in the footer, on the Contact page and on the FAQ page.",
    fields: [
      { name: "phone", label: "Phone", placeholder: "+91 98250 00000" },
      { name: "email", label: "Email", type: "email" },
      { name: "address", label: "Address", wide: true },
      { name: "whatsapp", label: "WhatsApp number", optional: true, hint: "With country code. Adds a WhatsApp link in the footer." },
      { name: "hours", label: "Opening hours", optional: true, placeholder: "Mon–Sat, 10am–8pm" },
    ],
  },
  {
    title: "Social links",
    icon: "share",
    description: "Full https:// addresses. Empty ones are hidden.",
    fields: [
      { name: "instagram", label: "Instagram", type: "url", optional: true },
      { name: "facebook", label: "Facebook", type: "url", optional: true },
      { name: "youtube", label: "YouTube", type: "url", optional: true },
      { name: "pinterest", label: "Pinterest", type: "url", optional: true },
    ],
  },
];

export default async function SettingsPage() {
  await requireAdmin();
  const block = await getBlock("settings");

  return (
    <div className="rise">
      <PageHero icon={Settings} eyebrow="Website · store" title="Store" accent="settings" description={<LastSaved at={block.updatedAt} by={block.updatedBy} />} />
      <BlockForm action={saveSettingsAction} sections={sections} values={block.data} preview="settings" />
    </div>
  );
}
