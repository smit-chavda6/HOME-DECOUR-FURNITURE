"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, LoaderCircle, MessageCircle, X } from "lucide-react";
import type { ProductSummary } from "@/lib/data/products";
import { cn, formatPrice } from "@/lib/utils";

type Message = {
  role: "user" | "bot";
  text: string;
  products?: ProductSummary[];
};

const suggestions = [
  "Sofas under ₹50,000",
  "Which chairs can I see in AR?",
  "Where is my order?",
  "What is your return policy?",
];

const greeting: Message = {
  role: "bot",
  text: "Hi! I can help you find furniture, check an order or answer questions about delivery and returns. What are you looking for?",
};

/** Floating shopping assistant in the bottom-right corner. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    const history = messages
      .slice(1)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 1200) }));

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json().catch(() => ({}));
      setMessages((prev) => [
        ...prev,
        response.ok
          ? { role: "bot", text: data.reply, products: data.products }
          : { role: "bot", text: data.error ?? "Sorry, something went wrong. Please try again." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "I could not connect. Please check your internet and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Shopping assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 bottom-24 z-40 flex h-[min(36rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-panel bg-surface shadow-2xl ring-1 ring-line"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="font-display text-lg font-medium">Ask us anything</p>
                <p className="text-xs text-muted">AI assistant · usually instant</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-9 place-items-center rounded-full hover:bg-surface-2"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
                  <p
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                      m.role === "user" ? "rounded-br-md bg-accent text-accent-ink" : "rounded-bl-md bg-surface-2",
                    )}
                  >
                    {m.text}
                  </p>
                  {m.products && m.products.length > 0 && (
                    <ul className="mt-2 w-full space-y-2">
                      {m.products.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/shop/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-2xl p-2 ring-1 ring-line transition-colors hover:bg-surface-2"
                          >
                            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                              {p.image && <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{p.name}</span>
                              <span className="block text-xs text-muted tabular-nums">{formatPrice(p.price)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {loading && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Thinking…
                </p>
              )}
              {messages.length === 1 && !loading && (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                placeholder="Type your question…"
                aria-label="Message"
                className="h-11 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
              >
                <ArrowUp className="size-5" aria-hidden />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        aria-expanded={open}
        className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-ink text-bg shadow-xl transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
      </button>
    </>
  );
}
