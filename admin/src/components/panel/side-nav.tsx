"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Shop",
    links: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/products", label: "Products", icon: Package },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/messages", label: "Messages", icon: Mail },
    ],
  },
  {
    label: "Website",
    links: [
      { href: "/content/home", label: "Home page", icon: Home },
      { href: "/content/banner", label: "Announcement", icon: Megaphone },
      { href: "/content/blog", label: "Blog", icon: FileText },
      { href: "/content/faq", label: "FAQ", icon: HelpCircle },
      { href: "/settings", label: "Store settings", icon: Settings },
    ],
  },
  {
    label: "Security",
    links: [{ href: "/admins", label: "Admins & log", icon: ShieldCheck }],
  },
];

export function SideNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-6 lg:overflow-y-auto lg:px-3 lg:pb-4">
      {groups.map((group) => (
        <div key={group.label} className="contents lg:block">
          <p className="hidden px-3 pb-2 text-[0.68rem] font-semibold tracking-[0.08em] text-muted uppercase lg:block">{group.label}</p>
          <ul className="contents lg:block lg:space-y-0.5">
            {group.links.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {/* glowing copper marker on the active page */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 -left-3 hidden h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity lg:block",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-lg transition-colors",
                        active ? "bg-accent text-accent-ink shadow-[0_4px_10px_-4px_var(--glow)]" : "text-muted group-hover:text-ink",
                      )}
                    >
                      <Icon className="size-[0.95rem]" aria-hidden />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
