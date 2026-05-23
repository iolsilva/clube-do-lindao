import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Brand } from "@/components/layout/brand";
import { adminNavigation } from "@/lib/navigation";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-lindao-line bg-white px-4 py-5 lg:block">
          <Brand />
          <nav className="mt-8 grid gap-1">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-lindao-blue-soft hover:text-lindao-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="border-b border-lindao-line bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-lindao-blue">
                Administração
              </p>
              <LogoutButton />
            </div>
          </header>
          <main className="flex w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
