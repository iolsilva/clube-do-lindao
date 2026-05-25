import Image from "next/image";
import { Banknote, CircleDollarSign, Hammer, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileAdminMenu } from "@/components/layout/mobile-admin-menu";
import { NavLink } from "@/components/layout/nav-link";
import { adminNavigation } from "@/lib/navigation";
import { formatCurrencyFromCents, formatPoints } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type AdminShellProps = {
  children: React.ReactNode;
};

type HeaderMetric = {
  detail: string;
  label: string;
  value: string;
};

async function getHeaderMetrics(): Promise<HeaderMetric[]> {
  const supabase = await createClient();
  const [customersResult, totalsResult] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("customer_points_view")
      .select("total_points, total_purchase_amount_cents"),
  ]);

  const totalRows = (totalsResult.data ?? []) as Array<{
    total_points: string | number;
    total_purchase_amount_cents: string | number;
  }>;
  const totalPoints = totalRows.reduce(
    (sum, row) => sum + Number(row.total_points),
    0,
  );
  const totalSalesCents = totalRows.reduce(
    (sum, row) => sum + Number(row.total_purchase_amount_cents),
    0,
  );

  return [
    {
      detail: "Clientes cadastrados no clube.",
      label: "Clientes",
      value: String(customersResult.count ?? 0),
    },
    {
      detail: "Pontos acumulados pelas compras registradas.",
      label: "Pontos",
      value: formatPoints(totalPoints),
    },
    {
      detail: "Valor total movimentado pelas compras registradas.",
      label: "Vendas",
      value: formatCurrencyFromCents(totalSalesCents),
    },
  ];
}

const metricIcons = [Users, CircleDollarSign, Banknote];

export async function AdminShell({ children }: AdminShellProps) {
  const metrics = await getHeaderMetrics();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="relative overflow-hidden border-b border-lindao-gold/45 bg-[radial-gradient(circle_at_8%_0%,rgba(245,197,24,0.22),transparent_18rem),radial-gradient(circle_at_78%_10%,rgba(37,99,235,0.4),transparent_20rem),linear-gradient(135deg,#1843b8_0%,#12328d_48%,#07143e_100%)] shadow-[0_26px_90px_rgba(0,0,0,0.34)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:42px_42px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full border border-lindao-gold/25 bg-lindao-gold/10"
        />
        <div className="relative z-[1] mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.75fr)_minmax(330px,0.9fr)] lg:items-center lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="relative flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent drop-shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
              <Image
                src="/images/logo.png"
                alt="Clube do Lindao"
                fill
                priority
                sizes="128px"
                className="object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-black uppercase leading-tight text-white sm:text-3xl">
                CLUBE DO LINDÃO
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-lindao-gold sm:text-sm">
                DEPÓSITO SÃO MARCOS · MATERIAL PARA CONSTRUÇÃO
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-lindao-gold/30 bg-lindao-dark/20 px-4 py-3 text-left shadow-[0_18px_48px_rgba(0,0,0,0.2)] lg:text-center">
            <div className="flex items-center gap-2 lg:justify-center">
              <Hammer
                aria-hidden="true"
                className="size-4 text-lindao-gold"
                strokeWidth={2.5}
              />
              <p className="text-sm font-black text-white">
                Comprou, pontuou, ganhou.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {metrics.map((metric, index) => {
              const Icon = metricIcons[index];

              return (
                <div
                  key={metric.label}
                  aria-label={`${metric.label}. ${metric.detail}`}
                  title={metric.detail}
                  className="rounded-lg border border-white/10 bg-white/10 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.18)] backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-lindao-gold"
                      strokeWidth={2.4}
                    />
                    <p className="truncate text-[11px] font-black uppercase tracking-wide text-slate-200">
                      {metric.label}
                    </p>
                  </div>
                  <p className="mt-2 truncate text-lg font-black text-white">
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-lindao-gold/25 bg-lindao-dark/95 shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="hidden items-center gap-2 lg:flex">
            {adminNavigation.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
          <MobileAdminMenu />
          <LogoutButton />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
