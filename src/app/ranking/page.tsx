import { Sparkles, Trophy } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  return `${position}º lugar`;
}

function getTopCardClass(position: number) {
  if (position === 1) {
    return "border-lindao-gold/70 bg-[radial-gradient(circle_at_80%_0%,rgba(245,197,24,0.18),transparent_12rem),linear-gradient(145deg,rgba(245,197,24,0.18),rgba(10,23,64,0.96))]";
  }

  if (position === 2) {
    return "border-slate-300/35 bg-[radial-gradient(circle_at_80%_0%,rgba(148,163,184,0.16),transparent_12rem),linear-gradient(145deg,rgba(148,163,184,0.13),rgba(10,23,64,0.96))]";
  }

  return "border-lindao-blue/55 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.18),transparent_12rem),linear-gradient(145deg,rgba(37,99,235,0.2),rgba(10,23,64,0.96))]";
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
  const remainingRanking = ranking.filter((row) => row.position > 3);

  return (
    <PublicShell>
      <section className="relative overflow-hidden rounded-lg border border-lindao-gold/35 bg-[radial-gradient(circle_at_84%_18%,rgba(245,197,24,0.16),transparent_14rem),radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.32),transparent_18rem),linear-gradient(135deg,#1843b8_0%,#10275f_48%,#060f2e_100%)] p-5 shadow-[0_24px_74px_rgba(0,0,0,0.3)] sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full border border-lindao-gold/30 bg-lindao-gold/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 right-10 hidden size-24 rounded-full border border-white/15 bg-lindao-blue/20 shadow-[0_0_70px_rgba(245,197,24,0.22)] sm:block"
        />

        <div className="relative z-[1] max-w-2xl space-y-3">
          <Badge>Área pública</Badge>
          <div>
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Ranking Clube do Lindão
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Acompanhe os clientes em destaque no programa de fidelidade.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="error" title="Não foi possível carregar o ranking">
          Tente novamente em alguns instantes.
        </Alert>
      ) : ranking.length === 0 ? (
        <EmptyState
          eyebrow="Sem pontuação"
          title="Ranking ainda sem clientes"
          description="Os clientes aparecem aqui quando acumularem pontos."
        />
      ) : (
        <>
          {topRanking.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-3">
              {topRanking.map((customer) => (
                <Card
                  key={customer.customer_id}
                  className={cn(
                    "overflow-hidden border",
                    getTopCardClass(customer.position),
                  )}
                >
                  <CardContent className="grid min-h-48 content-between gap-5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-10 items-center justify-center rounded-md border border-lindao-gold/35 bg-lindao-gold/15 text-lg font-black text-lindao-gold">
                          {customer.position}
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                            Destaque
                          </p>
                          <p className="text-sm font-black text-white">
                            {getPositionLabel(customer.position)}
                          </p>
                        </div>
                      </div>
                      <Trophy
                        aria-hidden="true"
                        className="size-5 text-lindao-gold"
                        strokeWidth={2.4}
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h2 className="line-clamp-2 text-xl font-black text-white">
                          {customer.customer_name}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {customer.customer_code ?? "Sem código"} ·{" "}
                          {customer.level_name ?? "Sem nível"}
                        </p>
                      </div>
                      <div className="inline-flex items-end gap-2 rounded-md border border-lindao-gold/25 bg-lindao-gold/10 px-3 py-2">
                        <span className="text-2xl font-black text-lindao-gold">
                          {formatPoints(Number(customer.total_points))}
                        </span>
                        <span className="pb-1 text-xs font-black uppercase tracking-wide text-slate-300">
                          pontos
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : null}

          {remainingRanking.length > 0 ? (
            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                      Classificação
                    </p>
                    <h2 className="mt-1 text-lg font-black text-white">
                      Ranking geral
                    </h2>
                  </div>
                  <Sparkles
                    aria-hidden="true"
                    className="size-5 text-lindao-gold"
                    strokeWidth={2.4}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/10">
                  {remainingRanking.map((customer) => (
                    <div
                      key={customer.customer_id}
                      className="grid gap-3 px-4 py-3 transition duration-200 hover:bg-white/[0.045] sm:grid-cols-[64px_1fr_auto] sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-10 items-center justify-center rounded-md border border-lindao-blue/45 bg-lindao-blue/20 text-sm font-black text-white">
                          {customer.position}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wide text-slate-400 sm:hidden">
                          {getPositionLabel(customer.position)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-white">
                          {customer.customer_name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide">
                          <span className="rounded-full border border-lindao-gold/30 bg-lindao-gold/10 px-3 py-1 text-lindao-gold">
                            {customer.customer_code ?? "Sem código"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                            {customer.level_name ?? "Sem nível"}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-black text-lindao-gold">
                          {formatPoints(Number(customer.total_points))}
                        </p>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          pontos
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </PublicShell>
  );
}
