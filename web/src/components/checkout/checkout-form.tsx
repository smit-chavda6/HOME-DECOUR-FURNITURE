"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  LoaderCircle,
  Lock,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  abandonPaymentAction,
  confirmPaymentAction,
  placeOrderAction,
} from "@/lib/actions/checkout";
import type { CurrentUser } from "@/lib/auth";
import { FREE_SHIPPING_FROM, calculateTotals } from "@/lib/pricing";
import { cn, formatPrice } from "@/lib/utils";
import { addressSchema, type FieldErrors } from "@/lib/validation";
import { useCart } from "@/stores/cart";
import { OrderCard } from "./order-card";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

/** Load Razorpay's checkout script once, only when someone pays online. */
function loadRazorpay(): Promise<RazorpayConstructor | null> {
  const w = window as unknown as { Razorpay?: RazorpayConstructor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(w.Razorpay ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

type Address = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal: string;
};

const steps = ["Delivery", "Payment", "Review"] as const;

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <ol className="flex items-center gap-3" aria-label="Checkout steps">
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-3 last:flex-none">
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(i)}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2.5 text-sm disabled:cursor-default"
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border text-xs font-semibold transition-all duration-500",
                  done && "border-transparent bg-accent text-accent-ink",
                  active && "border-accent text-accent shadow-[0_0_0_4px_var(--glow)]",
                  !done && !active && "border-line text-muted",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("hidden font-medium sm:inline", active || done ? "text-ink" : "text-muted")}>{label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="relative h-px flex-1 overflow-hidden bg-line">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-accent"
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

type CheckoutFormProps = {
  user: CurrentUser;
  onlinePayment: boolean;
};

/** Three-step checkout: delivery details, payment method, review and place. */
export function CheckoutForm({ user, onlinePayment }: CheckoutFormProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [address, setAddress] = useState<Address>({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address1: user.addressLine1,
    address2: user.addressLine2,
    city: user.city,
    state: user.state,
    postal: user.postalCode,
  });
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const cartItems = hydrated ? items : [];
  const totals = calculateTotals(cartItems);

  if (hydrated && cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-panel border border-line bg-surface px-6 py-20 text-center">
        <ShoppingBag className="size-10 text-muted" aria-hidden />
        <h2 className="mt-5 text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 max-w-sm text-muted">Add a piece or two, then come back here to check out.</p>
        <Link href="/shop" className={buttonStyles({ className: "mt-6" })}>
          Browse furniture
        </Link>
      </div>
    );
  }

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setMessage("");
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function continueFromAddress() {
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setMessage("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    go(1);
  }

  function finish(orderId: string) {
    clear();
    router.push(`/checkout/success?order=${orderId}`);
  }

  function placeOrder() {
    setMessage("");
    startTransition(async () => {
      const result = await placeOrderAction({
        items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        address,
        paymentMethod: method,
      });

      if (!result.ok) {
        setMessage(result.message);
        if (result.errors && Object.keys(result.errors).some((k) => k in address)) {
          setErrors(result.errors);
          go(0);
        }
        return;
      }
      if (!result.payment) {
        finish(result.orderId);
        return;
      }

      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        await abandonPaymentAction(result.orderId);
        setMessage("The payment window could not load. Check your connection or choose cash on delivery.");
        return;
      }

      const { payment, orderId } = result;
      await new Promise<void>((resolve) => {
        new Razorpay({
          key: payment.keyId,
          order_id: payment.razorpayOrderId,
          amount: payment.amountPaise,
          currency: "INR",
          name: "Home Decor Furniture",
          description: `Order ${orderId.slice(-8).toUpperCase()}`,
          prefill: { name: payment.name, email: payment.email, contact: payment.phone },
          theme: { color: "#e3a56f" },
          handler: async (response: RazorpayResponse) => {
            const confirmed = await confirmPaymentAction({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (confirmed.ok) finish(orderId);
            else setMessage(confirmed.message ?? "Payment could not be confirmed.");
            resolve();
          },
          modal: {
            ondismiss: async () => {
              await abandonPaymentAction(orderId);
              setMessage("Payment was cancelled. Your cart is still here.");
              resolve();
            },
          },
        }).open();
      });
    });
  }

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));
  const e = errors;
  const addressLines = [address.address1, address.address2, address.city, address.state, address.postal]
    .filter(Boolean)
    .join(", ");

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 60, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -60, filter: "blur(4px)" }),
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16">
      <div className="min-w-0">
        <Stepper step={step} onJump={go} />

        <div className="relative mt-10 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <form
                  noValidate
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    continueFromAddress();
                  }}
                  className="space-y-5"
                >
                  <h2 className="text-3xl font-semibold">Where should we deliver?</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="fullName" error={e.fullName}>
                      <Input id="fullName" autoComplete="name" value={address.fullName} onChange={set("fullName")} error={e.fullName} />
                    </Field>
                    <Field label="Phone" htmlFor="phone" error={e.phone}>
                      <Input id="phone" type="tel" autoComplete="tel" value={address.phone} onChange={set("phone")} error={e.phone} />
                    </Field>
                  </div>
                  <Field label="Email" htmlFor="email" error={e.email} hint="We send order updates here.">
                    <Input id="email" type="email" autoComplete="email" value={address.email} onChange={set("email")} error={e.email} />
                  </Field>
                  <Field label="Address" htmlFor="address1" error={e.address1}>
                    <Input id="address1" autoComplete="address-line1" placeholder="House number, street" value={address.address1} onChange={set("address1")} error={e.address1} />
                  </Field>
                  <Field label="Apartment, landmark" htmlFor="address2" error={e.address2} optional>
                    <Input id="address2" autoComplete="address-line2" value={address.address2} onChange={set("address2")} error={e.address2} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Field label="City" htmlFor="city" error={e.city}>
                      <Input id="city" autoComplete="address-level2" value={address.city} onChange={set("city")} error={e.city} />
                    </Field>
                    <Field label="State" htmlFor="state" error={e.state}>
                      <Input id="state" autoComplete="address-level1" value={address.state} onChange={set("state")} error={e.state} />
                    </Field>
                    <Field label="PIN code" htmlFor="postal" error={e.postal}>
                      <Input id="postal" inputMode="numeric" autoComplete="postal-code" value={address.postal} onChange={set("postal")} error={e.postal} />
                    </Field>
                  </div>
                  <FormMessage>{message}</FormMessage>
                  <Button type="submit" size="lg" className="mt-2">
                    Continue to payment
                    <ArrowRight aria-hidden />
                  </Button>
                </form>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-semibold">How would you like to pay?</h2>
                  <fieldset className="grid gap-3 sm:grid-cols-2">
                    <legend className="sr-only">Payment method</legend>
                    {[
                      {
                        value: "cod" as const,
                        icon: Banknote,
                        title: "Cash on delivery",
                        text: "Pay in cash or by UPI when your furniture arrives.",
                        enabled: true,
                      },
                      {
                        value: "razorpay" as const,
                        icon: CreditCard,
                        title: "Pay online",
                        text: onlinePayment ? "UPI, cards, net banking and wallets, secured by Razorpay." : "Coming soon.",
                        enabled: onlinePayment,
                      },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "ring-glow relative flex cursor-pointer flex-col gap-6 rounded-card border p-6 transition-all duration-300",
                          method === option.value ? "border-accent bg-accent/[0.07]" : "border-line bg-surface hover:border-ink/25",
                          !option.enabled && "pointer-events-none opacity-45",
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.value}
                          checked={method === option.value}
                          disabled={!option.enabled}
                          onChange={() => setMethod(option.value)}
                          className="sr-only"
                        />
                        <span className="flex items-center justify-between">
                          <span className="glass grid size-11 place-items-center rounded-2xl text-accent">
                            <option.icon className="size-5" aria-hidden />
                          </span>
                          <span
                            className={cn(
                              "grid size-6 place-items-center rounded-full border transition-colors",
                              method === option.value ? "border-accent bg-accent text-accent-ink" : "border-line",
                            )}
                          >
                            {method === option.value && <Check className="size-3.5" aria-hidden />}
                          </span>
                        </span>
                        <span>
                          <span className="block text-lg font-semibold">{option.title}</span>
                          <span className="mt-1 block text-sm text-muted">{option.text}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <ShieldCheck className="size-4 text-sage" aria-hidden />
                    Card details are entered only in Razorpay&apos;s secure window, never on our site.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="lg" onClick={() => go(0)}>
                      <ArrowLeft aria-hidden />
                      Back
                    </Button>
                    <Button size="lg" onClick={() => go(2)}>
                      Review order
                      <ArrowRight aria-hidden />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-semibold">Check and place your order</h2>
                  <dl className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface text-sm">
                    {[
                      { label: "Deliver to", value: `${address.fullName}, ${addressLines}`, step: 0 },
                      { label: "Contact", value: `${address.phone} · ${address.email}`, step: 0 },
                      { label: "Payment", value: method === "cod" ? "Cash on delivery" : "Pay online (Razorpay)", step: 1 },
                    ].map((row) => (
                      <div key={row.label} className="grid grid-cols-[6.5rem_1fr_auto] items-start gap-4 px-5 py-4">
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="min-w-0 break-words">{row.value}</dd>
                        <button type="button" onClick={() => go(row.step)} className="text-xs font-medium text-accent hover:underline">
                          Change
                        </button>
                      </div>
                    ))}
                  </dl>

                  {totals.shipping > 0 && (
                    <p className="text-sm text-muted">
                      Add {formatPrice(FREE_SHIPPING_FROM - totals.subtotal)} more to your cart for free shipping.
                    </p>
                  )}

                  <FormMessage>{message}</FormMessage>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="lg" onClick={() => go(1)} disabled={pending}>
                      <ArrowLeft aria-hidden />
                      Back
                    </Button>
                    <Button size="lg" onClick={placeOrder} disabled={pending || !hydrated} className="min-w-56">
                      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
                      {pending ? "Placing order…" : method === "cod" ? `Place order · ${formatPrice(totals.total)}` : `Pay ${formatPrice(totals.total)}`}
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    By placing this order you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-2">terms</Link>.
                  </p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <OrderCard
          items={cartItems}
          totals={totals}
          flipped={step === 2}
          address={address.fullName ? { name: address.fullName, lines: addressLines } : null}
        />
      </aside>
    </div>
  );
}
