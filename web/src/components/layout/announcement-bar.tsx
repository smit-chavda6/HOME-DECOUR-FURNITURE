import { getBanner } from "@/lib/data/content";
import { AnnouncementBarClient } from "./announcement-bar-client";

/**
 * Thin strip above the header with a message set in the admin panel
 * (Website → Announcement). Renders nothing when switched off.
 */
export async function AnnouncementBar() {
  const banner = await getBanner();
  if (!banner.enabled || !banner.text) return null;
  return <AnnouncementBarClient banner={banner} />;
}
