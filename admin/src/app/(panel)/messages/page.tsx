import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageTitle } from "@/components/panel/page-title";
import { DeleteMessageButton } from "@/components/panel/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminMessages } from "@/lib/data/shop";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await getAdminMessages();

  return (
    <div>
      <PageTitle title="Messages" description="Sent from the shop's contact page." />

      {messages.length === 0 ? (
        <p className="rounded-card bg-surface-2 px-6 py-16 text-center text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-card bg-surface p-5 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.subject || "No subject"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {m.name} · {formatDateTime(m.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium hover:bg-surface-2"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    Reply
                  </a>
                  <DeleteMessageButton id={m.id} />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed break-words whitespace-pre-line">{m.message}</p>
              <p className="mt-3 text-xs text-muted">
                {m.email}
                {m.phone && ` · ${m.phone}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
