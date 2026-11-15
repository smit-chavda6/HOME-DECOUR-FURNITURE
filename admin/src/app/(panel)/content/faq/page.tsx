import type { Metadata } from "next";
import { FaqEditor } from "@/components/panel/faq-editor";
import { LastSaved } from "@/components/panel/last-saved";
import { HelpCircle } from "lucide-react";
import { PageHero } from "@/components/panel/ui";
import { requireAdmin } from "@/lib/auth";
import { getBlock } from "@/lib/data/content";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  await requireAdmin();
  const block = await getBlock("faq");

  return (
    <div className="rise">
      <PageHero
        icon={HelpCircle}
        eyebrow="Website · help centre"
        title="Questions,"
        accent="answered"
        description={
          <>
            Questions on the shop&apos;s FAQ page, in groups. Changes are kept in this page until you press Save.{" "}
            <LastSaved at={block.updatedAt} by={block.updatedBy} />
          </>
        }
      />
      <FaqEditor initial={block.data} />
    </div>
  );
}
