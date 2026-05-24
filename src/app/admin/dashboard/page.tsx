import Link from "next/link";
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
  blue: "border-lindao-blue/25 bg-lindao-blue-soft",
  gold: "border-lindao-gold/40 bg-lindao-gold-soft",
  green: "border-emerald-200 bg-emerald-50",
  navy: "border-lindao-navy/15 bg-white",
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
        "rounded-lg border p-5 shadow-[0_18px_50px_rgba(12,36,72,0.07)]",
        metricTones[tone],
      )}
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-lindao-navy sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
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
    <div className="rounded-lg border border-dashed border-lindao-line bg-slate-50/70 p-6">
      <p className="font-black text-lindao-navy">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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
        title="Dashboard"
        description="Visao executiva do Clube do Lindao com clientes, compras, pontos e movimentacoes recentes."
      />

      {loadError ? (
        <Alert variant="error" title="Nao foi possivel atualizar o dashboard">
          Confira se o usuario logado tem perfil admin e se as views do Supabase
          estao aplicadas.
        </Alert>
      ) : null}

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
                  Top 5 ranking
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Clientes com maior pontuacao total.
                </p>
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
