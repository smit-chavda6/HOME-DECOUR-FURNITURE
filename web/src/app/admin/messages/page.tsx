import { Mail } from "lucide-react";
import { formatDate } from "@/components/orders/order-status";
import { DeleteMessageButton } from "@/components/admin/row-actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminMessages } from "@/lib/data/admin";

export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await getAdminMessages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-medium tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted">Sent from the contact page.</p>
      </div>

      {messages.length === 0 ? (
        <p className="rounded-card bg-surface-2 px-6 py-16 text-center text-muted">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-card bg-surface p-5 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{m.subject || "No subject"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {m.name} · {formatDate(m.date)}
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
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
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
