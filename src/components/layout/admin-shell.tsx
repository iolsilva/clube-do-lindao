import { LogoutButton } from "@/components/auth/logout-button";
import { Brand } from "@/components/layout/brand";
import { NavLink } from "@/components/layout/nav-link";
import { adminNavigation } from "@/lib/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-lindao-dark/90 px-4 py-5 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <Brand href="/admin/dashboard" />
          <div className="mt-6 rounded-lg border border-lindao-gold/35 bg-lindao-gold/10 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-lindao-gold">
              Programa de Fidelidade Oficial
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Comprou, pontuou, ganhou.
            </p>
          </div>
          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
            {adminNavigation.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1843b8]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-lindao-gold">
                  Programa de Fidelidade Oficial
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  Comprou, pontuou, ganhou.
                </p>
              </div>
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
