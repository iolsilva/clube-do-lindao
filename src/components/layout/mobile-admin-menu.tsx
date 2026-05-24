"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "@/components/layout/nav-link";
import { adminNavigation } from "@/lib/navigation";

export function MobileAdminMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-lindao-gold/40 bg-lindao-gold/10 px-3 text-sm font-black text-lindao-gold shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:bg-lindao-gold/20"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-4" strokeWidth={2.6} />
        ) : (
          <Menu aria-hidden="true" className="size-4" strokeWidth={2.6} />
        )}
        Menu
      </button>

      {isOpen ? (
        <div className="absolute left-4 right-4 top-full z-30 mt-3 rounded-lg border border-lindao-gold/30 bg-lindao-dark/95 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur">
          <nav className="grid gap-2">
            {adminNavigation.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
