import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { publicNavigation } from "@/lib/navigation";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfdff_0%,#f0f5fb_50%,#f8fafc_100%)]">
      <header className="sticky top-0 z-10 border-b border-lindao-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Brand />
          <nav className="flex items-center gap-2 overflow-x-auto">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-lindao-blue-soft hover:text-lindao-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
