import { Brand } from "@/components/layout/brand";
import { NavLink } from "@/components/layout/nav-link";
import { publicNavigation } from "@/lib/navigation";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-10 border-b border-lindao-gold/30 bg-[linear-gradient(135deg,rgba(24,67,184,0.94),rgba(6,15,46,0.94))] shadow-[0_18px_54px_rgba(0,0,0,0.24)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Brand />
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="hidden rounded-full border border-lindao-gold/40 bg-lindao-gold/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-lindao-gold sm:block">
              Programa de Fidelidade Oficial
            </div>
            <nav className="flex items-center gap-2 overflow-x-auto">
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
