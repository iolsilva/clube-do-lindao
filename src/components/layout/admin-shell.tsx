import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Brand } from "@/components/layout/brand";
import { adminNavigation } from "@/lib/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_48%,#f7f8fb_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-lindao-line/80 bg-white/95 px-4 py-5 shadow-[0_18px_60px_rgba(12,36,72,0.08)] backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <Brand />
          <div className="mt-6 rounded-lg border border-lindao-gold/35 bg-lindao-gold-soft p-3">
            <p className="text-xs font-black uppercase tracking-wide text-lindao-navy">
              Clube de vantagens
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Operacao, pontos e recompensas em um so painel.
            </p>
          </div>
          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-lindao-blue-soft hover:text-lindao-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-lindao-line/80 bg-white/85 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black uppercase tracking-wide text-lindao-blue">
                Administração
              </p>
              <LogoutButton />
            </div>
          </header>
          <main className="flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
