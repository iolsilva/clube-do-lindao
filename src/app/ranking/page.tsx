import Link from "next/link";
import { Search, Sparkles, Trophy } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPoints } from "@/lib/formatters";
import { getPublicRanking } from "@/lib/public-ranking";
import { cn } from "@/lib/utils";

type RankingPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function getPositionLabel(position: number) {
  return `${position}º lugar`;
}

function getTopCardClass(position: number) {
  if (position === 1) {
    return "border-lindao-gold/80 bg-[radial-gradient(circle_at_80%_0%,rgba(245,197,24,0.24),transparent_12rem),linear-gradient(145deg,rgba(245,197,24,0.2),rgba(10,23,64,0.96))] shadow-[0_26px_84px_rgba(245,197,24,0.12)]";
  }

  if (position === 2) {
    return "border-slate-300/35 bg-[radial-gradient(circle_at_80%_0%,rgba(148,163,184,0.16),transparent_12rem),linear-gradient(145deg,rgba(148,163,184,0.13),rgba(10,23,64,0.96))]";
  }

  return "border-lindao-blue/55 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.18),transparent_12rem),linear-gradient(145deg,rgba(37,99,235,0.2),rgba(10,23,64,0.96))]";
}

function getPositionBadgeClass(position: number) {
  if (position === 1) {
    return "border-lindao-gold/55 bg-lindao-gold/20 text-lindao-gold";
  }

  if (position === 2) {
    return "border-slate-300/35 bg-slate-300/10 text-slate-100";
  }

  if (position === 3) {
    return "border-lindao-blue/45 bg-lindao-blue/20 text-white";
  }

  return "border-white/10 bg-white/5 text-slate-200";
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const { error, fullRanking, ranking } = await getPublicRanking(search);
  const topRanking = fullRanking.filter((row) => row.position <= 3);

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
          {error}
        </Alert>
      ) : fullRanking.length === 0 ? (
        <EmptyState
          eyebrow="Sem pontuação"
          title="Nenhum participante no ranking ainda."
          description="Os clientes aparecem aqui quando acumularem pontos."
        />
      ) : (
        <>
          {topRanking.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-3">
              {topRanking.map((customer) => (
                <Card
                  key={`${customer.position}-${customer.customer_code ?? customer.customer_name}`}
                  className={cn(
                    "overflow-hidden border",
                    getTopCardClass(customer.position),
                    customer.position === 1 ? "md:-translate-y-2" : null,
                  )}
                >
                  <CardContent
                    className={cn(
                      "grid content-between gap-5 p-5",
                      customer.position === 1 ? "min-h-56" : "min-h-48",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex items-center justify-center rounded-md border border-lindao-gold/35 bg-lindao-gold/15 font-black text-lindao-gold",
                            customer.position === 1
                              ? "size-12 text-xl"
                              : "size-10 text-lg",
                          )}
                        >
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
                        <h2
                          className={cn(
                            "line-clamp-2 font-black text-white",
                            customer.position === 1 ? "text-2xl" : "text-xl",
                          )}
                        >
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

          <Card className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                    Classificação
                  </p>
                  <h2 className="mt-1 text-lg font-black text-white">
                    Ranking completo
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="w-fit px-2.5 py-0.5">
                    {ranking.length}{" "}
                    {ranking.length === 1 ? "participante" : "participantes"}
                  </Badge>
                  <Sparkles
                    aria-hidden="true"
                    className="hidden size-5 text-lindao-gold sm:block"
                    strokeWidth={2.4}
                  />
                </div>
              </div>

              <form className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="public-ranking-search">
                  Buscar participante
                </label>
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="public-ranking-search"
                    name="q"
                    defaultValue={search}
                    className="h-10 w-full rounded-md border border-lindao-line bg-white py-2 pl-9 pr-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                    placeholder="Buscar por nome, telefone ou código"
                  />
                </div>
                <Button type="submit" className="h-10 px-4">
                  Buscar
                </Button>
                {search ? (
                  <Link
                    href="/ranking"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/35 px-4 text-sm font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                  >
                    Limpar
                  </Link>
                ) : null}
              </form>
            </CardHeader>
            <CardContent className="p-0">
              {ranking.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    eyebrow="Sem resultados"
                    title="Nenhum participante encontrado."
                    description="Tente buscar por outro nome, telefone ou código."
                  />
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.035] text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          <th className="px-4 py-3 text-lindao-gold">
                            Colocação
                          </th>
                          <th className="px-4 py-3">Integrante</th>
                          <th className="px-4 py-3">Código</th>
                          <th className="px-4 py-3">Nível</th>
                          <th className="px-4 py-3 text-right text-lindao-gold">
                            Pontos
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {ranking.map((customer) => (
                          <tr
                            key={`${customer.position}-${customer.customer_code ?? customer.customer_name}`}
                            className="transition duration-200 hover:bg-white/[0.045]"
                          >
                            <td className="px-4 py-3">
                              <div
                                className={cn(
                                  "inline-flex h-9 min-w-12 items-center justify-center gap-1 rounded-md border px-2 text-sm font-black",
                                  getPositionBadgeClass(customer.position),
                                )}
                              >
                                {customer.position <= 3 ? (
                                  <Trophy
                                    aria-hidden="true"
                                    className="size-3.5"
                                    strokeWidth={2.5}
                                  />
                                ) : null}
                                {customer.position}º
                              </div>
                            </td>
                            <td className="max-w-[260px] px-4 py-3">
                              <p className="truncate text-sm font-black text-white">
                                {customer.customer_name}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full border border-lindao-gold/25 bg-lindao-gold/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-lindao-gold">
                                {customer.customer_code ?? "Sem código"}
                              </span>
                            </td>
                            <td className="max-w-[180px] px-4 py-3">
                              <p className="truncate text-sm font-semibold text-slate-300">
                                {customer.level_name ?? "Sem nível"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-lg font-black text-lindao-gold">
                                {formatPoints(Number(customer.total_points))}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-white/10 md:hidden">
                    {ranking.map((customer) => (
                      <div
                        key={`${customer.position}-${customer.customer_code ?? customer.customer_name}`}
                        className="grid gap-3 px-4 py-3 transition duration-200 hover:bg-white/[0.045]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={cn(
                              "inline-flex h-9 min-w-12 items-center justify-center gap-1 rounded-md border px-2 text-sm font-black",
                              getPositionBadgeClass(customer.position),
                            )}
                          >
                            {customer.position <= 3 ? (
                              <Trophy
                                aria-hidden="true"
                                className="size-3.5"
                                strokeWidth={2.5}
                              />
                            ) : null}
                            {customer.position}º
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-lindao-gold">
                              {formatPoints(Number(customer.total_points))}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                              pontos
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="line-clamp-2 text-base font-black text-white">
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
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PublicShell>
  );
}
