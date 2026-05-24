import { PublicShell } from "@/components/layout/public-shell";
import Image from "next/image";
import { Alert } from "@/components/ui/alert";
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
    return "border-lindao-gold bg-[linear-gradient(145deg,rgba(245,197,24,0.22),rgba(10,23,64,0.96))]";
  }

  if (position === 2) {
    return "border-slate-300/40 bg-[linear-gradient(145deg,rgba(148,163,184,0.18),rgba(10,23,64,0.96))]";
  }

  return "border-lindao-blue/50 bg-[linear-gradient(145deg,rgba(37,99,235,0.22),rgba(10,23,64,0.96))]";
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

      <section className="relative overflow-hidden rounded-lg border border-lindao-gold/30 bg-[radial-gradient(circle_at_84%_26%,rgba(245,197,24,0.18),transparent_18rem),linear-gradient(135deg,rgba(24,67,184,0.9),rgba(6,15,46,0.96))] p-5 shadow-[0_24px_74px_rgba(0,0,0,0.3)] sm:p-7">
        <div className="relative z-[1] max-w-2xl space-y-3">
          <Badge>Programa de Fidelidade Oficial</Badge>
          <h2 className="text-3xl font-black text-white sm:text-5xl">
            Comprou, pontuou, ganhou.
          </h2>
          <p className="max-w-xl text-base leading-7 text-slate-200">
            Consulte o desempenho dos clientes ativos e acompanhe quem esta no
            topo do Clube do Lindao.
          </p>
        </div>
        <Image
          src="/images/boneco3.PNG"
          alt=""
          width={240}
          height={300}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 right-4 hidden max-h-[230px] w-auto object-contain opacity-90 drop-shadow-[0_24px_36px_rgba(0,0,0,0.34)] lg:block"
        />
      </section>

      {error ? (
        <Alert variant="error" title="Nao foi possivel carregar o ranking">
          Nao foi possivel carregar o ranking agora. Confira se a view publica
          foi aplicada no Supabase.
        </Alert>
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
                    <Badge>Destaque {customer.position}</Badge>
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
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200">
                        {customer.level_name ?? "Sem nivel"}
                      </span>
                      <span className="rounded-full bg-lindao-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lindao-gold">
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
                        <span className="rounded-full bg-lindao-gold/15 px-3 py-1 text-lindao-gold">
                          {customer.customer_code ?? "Sem codigo"}
                        </span>
                        <span className="rounded-full bg-lindao-blue/20 px-3 py-1 text-slate-200">
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
