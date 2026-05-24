import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/layout/nav-link";
import { publicNavigation } from "@/lib/navigation";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 overflow-hidden border-b border-lindao-gold/45 bg-[radial-gradient(circle_at_10%_0%,rgba(245,197,24,0.18),transparent_17rem),radial-gradient(circle_at_88%_12%,rgba(37,99,235,0.34),transparent_18rem),linear-gradient(135deg,#1843b8_0%,#12328d_52%,#07143e_100%)] shadow-[0_20px_64px_rgba(0,0,0,0.3)] backdrop-blur">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border border-lindao-gold/25 bg-lindao-gold/10"
        />

        <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/ranking"
              className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent drop-shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
            >
              <Image
                src="/images/logo.PNG"
                alt="Clube do Lindao"
                fill
                priority
                sizes="56px"
                className="object-contain"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xl font-black uppercase leading-tight text-white sm:text-2xl">
                CLUBE DO LINDÃO
              </p>
              <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-lindao-gold">
                Depósito São Marcos
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <Badge className="w-fit">Programa de Fidelidade Oficial</Badge>
            <nav className="flex items-center gap-2 overflow-x-auto rounded-lg border border-white/10 bg-lindao-dark/25 p-1">
              {publicNavigation.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                />
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
