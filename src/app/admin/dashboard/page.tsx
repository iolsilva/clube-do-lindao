import Link from "next/link";
import Image from "next/image";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  calculatePointsFromCents,
  formatCurrencyFromCents,
  formatDateTime,
  formatPoints,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type RankingRow = {
  active: boolean;
  customer_code: string | null;
  customer_id: string;
  customer_name: string;
  level_name: string | null;
  ranking_position: number;
  total_points: string | number;
};

type CustomerRelation = {
  code: string | null;
  id: string;
  name: string;
};

type PurchaseRow = {
  amount_cents: number;
  customers: CustomerRelation | CustomerRelation[] | null;
  id: string;
  points: string | number | null;
  purchased_at: string;
};

type MetricCardProps = {
  detail: string;
  label: string;
  tone: "blue" | "gold" | "green" | "navy";
  value: string;
};

const metricTones: Record<MetricCardProps["tone"], string> = {
  blue: "border-lindao-blue/40 bg-lindao-blue/20",
  gold: "border-lindao-gold/45 bg-lindao-gold/15",
  green: "border-emerald-300/30 bg-emerald-400/10",
  navy: "border-white/10 bg-white/8",
};

function getCustomerFromPurchase(customer: PurchaseRow["customers"]) {
  if (Array.isArray(customer)) {
    return customer[0] ?? null;
  }

  return customer;
}

function MetricCard({ detail, label, tone, value }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-0.5 hover:border-lindao-gold/45",
        metricTones[tone],
      )}
    >
      <p className="text-xs font-black uppercase tracking-wide text-lindao-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}
function InlineEmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-lindao-gold/25 bg-white/5 p-6">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function getRankStyle(position: number) {
  if (position === 1) {
    return "bg-lindao-gold text-lindao-navy";
  }

  if (position === 2) {
    return "bg-slate-200 text-lindao-navy";
  }

  if (position === 3) {
    return "bg-lindao-blue-soft text-lindao-blue";
  }

  return "bg-lindao-navy text-white";
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    totalCustomersResult,
    activeCustomersResult,
    purchasesCountResult,
    pointsResult,
    rankingResult,
    latestPurchasesResult,
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("purchases").select("id", { count: "exact", head: true }),
    supabase.from("customer_points_view").select("total_points"),
    supabase
      .from("customer_points_view")
      .select(
        "ranking_position, customer_id, customer_code, customer_name, active, level_name, total_points",
      )
      .order("ranking_position", { ascending: true })
      .order("customer_name", { ascending: true })
      .limit(5),
    supabase
      .from("purchases")
      .select("id, amount_cents, points, purchased_at, customers(id, code, name)")
      .order("purchased_at", { ascending: false })
      .limit(6),
  ]);

  const pointsRows = (pointsResult.data ?? []) as Array<{
    total_points: string | number;
  }>;
  const topRanking = (rankingResult.data ?? []) as RankingRow[];
  const latestPurchases = (latestPurchasesResult.data ?? []) as PurchaseRow[];
  const totalPoints = pointsRows.reduce(
    (sum, row) => sum + Number(row.total_points),
    0,
  );
  const loadError =
    totalCustomersResult.error?.message ??
    activeCustomersResult.error?.message ??
    purchasesCountResult.error?.message ??
    pointsResult.error?.message ??
    rankingResult.error?.message ??
    latestPurchasesResult.error?.message;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Painel"
        description="Indicadores do Clube do Lindao."
      />

      {loadError ? (
        <Alert variant="error" title="Nao foi possivel atualizar o painel">
          Tente novamente em alguns instantes.
        </Alert>
      ) : null}

      <section className="relative overflow-hidden rounded-lg border border-lindao-gold/35 bg-[radial-gradient(circle_at_78%_18%,rgba(245,197,24,0.2),transparent_18rem),linear-gradient(135deg,rgba(24,67,184,0.88),rgba(6,15,46,0.96))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-8">
        <div className="relative z-[1] max-w-2xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Image
              src="/images/logo.PNG"
              alt="Clube do Lindao"
              width={72}
              height={72}
              priority
              className="object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.28)]"
            />
            <Badge>Programa de Fidelidade Oficial</Badge>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white sm:text-5xl">
              Comprou, pontuou, ganhou.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-200">
              Painel administrativo do Clube do Lindao para acompanhar clientes,
              compras, pontos e premios do Deposito Sao Marcos.
            </p>
          </div>
        </div>
        <Image
          src="/images/boneco1.PNG"
          alt=""
          width={360}
          height={420}
          priority
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-4 hidden max-h-[310px] w-auto object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.32)] md:block"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total de clientes"
          value={String(totalCustomersResult.count ?? 0)}
          detail="Clientes cadastrados no clube."
          tone="navy"
        />
        <MetricCard
          label="Clientes ativos"
          value={String(activeCustomersResult.count ?? 0)}
          detail="Aptos a aparecer no ranking publico."
          tone="green"
        />
        <MetricCard
          label="Total de compras"
          value={String(purchasesCountResult.count ?? 0)}
          detail="Historico de compras registradas."
          tone="blue"
        />
        <MetricCard
          label="Pontos gerados"
          value={formatPoints(totalPoints)}
          detail="Soma dos pontos acumulados por compras."
          tone="gold"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-lindao-navy">
                  5 melhores no ranking
                </h2>
              </div>
              <Link
                href="/admin/ranking"
                className="text-sm font-black text-lindao-blue hover:text-lindao-navy"
              >
                Ver completo
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {topRanking.length === 0 ? (
              <div className="p-5">
                <InlineEmptyState
                  title="Ranking ainda vazio"
                  description="Registre compras para que os clientes aparecam por pontuacao."
                />
              </div>
            ) : (
              <div className="divide-y divide-lindao-line/80">
                {topRanking.map((customer) => (
                  <div
                    key={customer.customer_id}
                    className="grid gap-4 p-5 sm:grid-cols-[56px_1fr_auto] sm:items-center"
                  >
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-md text-lg font-black",
                        getRankStyle(customer.ranking_position),
                      )}
                    >
                      {customer.ranking_position}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-black text-lindao-navy">
                          {customer.customer_name}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                            customer.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {customer.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {customer.customer_code ?? "Sem codigo"} |{" "}
                        {customer.level_name ?? "Sem nivel"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black text-lindao-blue">
                        {formatPoints(Number(customer.total_points))}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        pontos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-lindao-navy">
                  Ultimas compras
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Movimentacoes mais recentes do clube.
                </p>
              </div>
              <Badge>{latestPurchases.length} registros</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestPurchases.length === 0 ? (
              <div className="p-5">
                <InlineEmptyState
                  title="Sem compras recentes"
                  description="As ultimas compras aparecem aqui assim que forem cadastradas."
                />
              </div>
            ) : (
              <div className="divide-y divide-lindao-line/80">
                {latestPurchases.map((purchase) => {
                  const customer = getCustomerFromPurchase(purchase.customers);
                  const points =
                    purchase.points === null
                      ? calculatePointsFromCents(purchase.amount_cents)
                      : Number(purchase.points);

                  return (
                    <div key={purchase.id} className="grid gap-3 p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-black text-lindao-navy">
                            {customer?.name ?? "Cliente removido"}
                          </p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                            {customer?.code ?? "Sem codigo"} |{" "}
                            {formatDateTime(purchase.purchased_at)}
                          </p>
                        </div>
                        <p className="text-lg font-black text-lindao-navy">
                          {formatCurrencyFromCents(purchase.amount_cents)}
                        </p>
                      </div>
                      <div className="rounded-md bg-lindao-blue-soft px-3 py-2 text-sm font-bold text-lindao-blue">
                        {formatPoints(points)} pontos gerados
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
