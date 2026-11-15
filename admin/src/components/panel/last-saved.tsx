import { formatDateTime } from "@/lib/utils";

/** "Last saved 15 Nov 2026, 10:42 by smit", or a note that the shop shows its built-in text. */
export function LastSaved({ at, by }: { at: string | null; by: string }) {
  if (!at) {
    return <>Not edited yet: the shop shows its built-in text, filled in below.</>;
  }
  return (
    <>
      Last saved {formatDateTime(at)}
      {by && ` by ${by}`}.
    </>
  );
}
