"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap rounded-md border px-3 py-2 text-sm font-black transition duration-200",
        isActive
          ? "border-lindao-gold/60 bg-lindao-gold text-lindao-dark shadow-[0_12px_28px_rgba(245,197,24,0.2)]"
          : "border-transparent text-slate-300 hover:border-lindao-gold/30 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}

