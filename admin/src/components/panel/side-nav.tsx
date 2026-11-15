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
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-6 lg:px-3 lg:pb-6">
      {groups.map((group) => (
        <div key={group.label} className="contents lg:block">
          <p className="eyebrow hidden px-3 pb-2 lg:block">{group.label}</p>
          <ul className="contents lg:block lg:space-y-0.5">
            {group.links.map(({ href, label, icon: Icon }) => (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive(href) ? "bg-ink text-bg" : "text-ink/80 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
