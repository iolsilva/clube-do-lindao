"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  Layers3,
  LayoutDashboard,
  ShoppingCart,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type NavigationIcon } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  icon?: NavigationIcon;
  label: string;
  onClick?: () => void;
};

const icons: Record<NavigationIcon, LucideIcon> = {
  Gift,
  Layers3,
  LayoutDashboard,
  ShoppingCart,
  Trophy,
  Users,
};

export function NavLink({ href, icon, label, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  const Icon = icon ? icons[icon] : null;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3.5 text-sm font-black transition duration-200",
        isActive
          ? "border-lindao-gold/70 bg-lindao-gold text-lindao-dark shadow-[0_14px_34px_rgba(245,197,24,0.24)]"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:-translate-y-0.5 hover:border-lindao-gold/40 hover:bg-lindao-gold/10 hover:text-white",
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "size-4 transition",
            isActive ? "text-lindao-dark" : "text-lindao-gold",
          )}
          strokeWidth={2.4}
        />
      ) : null}
      {label}
    </Link>
  );
}
