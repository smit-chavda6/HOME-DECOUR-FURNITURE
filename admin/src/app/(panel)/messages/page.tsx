import type { Metadata } from "next";
import { Inbox, Mail, Phone, Reply } from "lucide-react";
import { DeleteMessageButton } from "@/components/panel/row-actions";
import { Avatar, EmptyState, PageHero, StatStrip } from "@/components/panel/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdminMessages } from "@/lib/data/shop";
import { daysAgo, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await getAdminMessages();
  const weekAgo = daysAgo(7);
  const thisWeek = messages.filter((m) => new Date(m.date).getTime() >= weekAgo).length;
  const subjects = new Set(messages.map((m) => m.subject).filter(Boolean)).size;

  return (
    <div className="rise">
      <PageHero
        icon={Inbox}
        eyebrow="Inbox"
        title="Messages from"
        accent="the shop"
        description="Everything sent through the shop's contact page. Reply opens your email app with the subject filled in."
      />

      <StatStrip
        items={[
          { label: "Messages", value: messages.length, tone: "accent" },
          { label: "This week", value: thisWeek, tone: thisWeek ? "good" : "default" },
          { label: "Topics", value: subjects },
          { label: "With a phone number", value: messages.filter((m) => m.phone).length },
        ]}
      />

      {messages.length === 0 ? (
        <EmptyState title="Inbox zero" text="No messages yet. They will appear here as soon as someone writes in." />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id}>
              <details className="group rounded-card bg-surface ring-1 ring-line transition open:ring-accent/35 hover:ring-accent/25">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <Avatar name={m.name || m.email} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{m.name || m.email}</p>
                      <span className="shrink-0 font-mono text-[0.68rem] text-muted">{formatDateTime(m.date)}</span>
                    </div>
                    <p className="truncate text-sm">
                      <span className="font-medium text-accent">{m.subject || "No subject"}</span>
                      <span className="text-muted"> — {m.message}</span>
                    </p>
                  </div>
                </summary>
                <div className="border-t border-line px-4 pt-4 pb-5 sm:px-5 sm:pl-[4.75rem]">
                  <p className="text-sm leading-relaxed break-words whitespace-pre-line">{m.message}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="size-3.5" aria-hidden />
                        {m.email}
                      </span>
                      {m.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" aria-hidden />
                          {m.phone}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-medium text-accent-ink shadow-[0_8px_24px_-10px_var(--glow)]"
                      >
                        <Reply className="size-3.5" aria-hidden />
                        Reply
                      </a>
                      <DeleteMessageButton id={m.id} />
                    </div>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
