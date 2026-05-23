import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatPoints } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type RankingRow = {
  position: number;
  customer_id: string;
  customer_code: string | null;
  customer_name: string;
  level_name: string | null;
  total_points: string | number;
};

function getPositionLabel(position: number) {
  return `${position}o lugar`;
}

function getTopCardClass(position: number) {
  if (position === 1) {
    return "border-lindao-gold bg-lindao-gold-soft";
  }

  if (position === 2) {
    return "border-slate-300 bg-slate-50";
  }

  return "border-lindao-blue/30 bg-lindao-blue-soft";
}

export default async function RankingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_ranking_view")
    .select(
      "position, customer_id, customer_code, customer_name, level_name, total_points",
    )
    .order("position", { ascending: true })
    .order("customer_name", { ascending: true });

  const ranking = (data ?? []) as RankingRow[];
  const topRanking = ranking.filter((row) => row.position <= 3);

  return (
    <PublicShell>
      <PageHeader
        eyebrow="Area publica"
        title="Ranking Clube do Lindao"
        description="Acompanhe os clientes com maior pontuacao no clube de vantagens."
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
          Nao foi possivel carregar o ranking agora. Confira se a view publica
          foi aplicada no Supabase.
        </div>
      ) : ranking.length === 0 ? (
        <EmptyState
          eyebrow="Sem pontuacao"
          title="Ranking ainda sem clientes"
          description="Assim que as compras forem registradas, os clientes ativos aparecem aqui automaticamente."
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {topRanking.map((customer) => (
              <Card
                key={customer.customer_id}
                className={cn("border-2", getTopCardClass(customer.position))}
              >
                <CardContent className="grid min-h-56 content-between gap-6">
                  <div className="flex items-start justify-between gap-3">
                    <Badge>Top {customer.position}</Badge>
                    <span className="text-4xl font-black text-lindao-navy">
                      #{customer.position}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-2xl font-black text-lindao-navy">
                        {customer.customer_name}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {customer.customer_code ?? "Sem codigo"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lindao-blue">
                        {customer.level_name ?? "Sem nivel"}
                      </span>
                      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lindao-navy">
                        {formatPoints(Number(customer.total_points))} pontos
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-lindao-line">
                {ranking.map((customer) => (
                  <div
                    key={customer.customer_id}
                    className="grid gap-4 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center sm:p-5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-12 items-center justify-center rounded-md bg-lindao-blue text-lg font-black text-white">
                        {customer.position}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:hidden">
                        {getPositionLabel(customer.position)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-lindao-navy">
                        {customer.customer_name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-lindao-gold-soft px-3 py-1 text-lindao-navy">
                          {customer.customer_code ?? "Sem codigo"}
                        </span>
                        <span className="rounded-full bg-lindao-blue-soft px-3 py-1 text-lindao-blue">
                          {customer.level_name ?? "Sem nivel"}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black text-lindao-navy">
                        {formatPoints(Number(customer.total_points))}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        pontos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PublicShell>
  );
}
