import Link from "next/link";
import { Search } from "lucide-react";
import { toggleRewardStatusAction } from "@/app/admin/premios/actions";
import { RewardForm } from "@/components/rewards/reward-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatPoints } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type AdminPremiosPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

type RewardRow = {
  active: boolean;
  description: string | null;
  id: string;
  name: string;
  points_required: string | number;
};

function getStatusMessage(status?: string) {
  const messages: Record<string, string> = {
    "auth-error": "Usuário não autenticado.",
    activated: "Prêmio ativado com sucesso.",
    created: "Prêmio criado com sucesso.",
    deactivated: "Prêmio inativado com sucesso.",
    invalid: "Prêmio inválido.",
    "status-error": "Não foi possível alterar o status do prêmio.",
    updated: "Prêmio atualizado com sucesso.",
  };

  return status ? messages[status] : undefined;
}

function matchesRewardSearch(reward: RewardRow, search: string) {
  const normalizedSearch = search.toLowerCase();

  return (
    reward.name.toLowerCase().includes(normalizedSearch) ||
    (reward.description ?? "").toLowerCase().includes(normalizedSearch) ||
    String(reward.points_required).includes(normalizedSearch)
  );
}

export default async function AdminPremiosPage({
  searchParams,
}: AdminPremiosPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("id, name, description, points_required, active")
    .order("active", { ascending: false })
    .order("points_required", { ascending: true })
    .order("name", { ascending: true });

  const rewards = (data ?? []) as RewardRow[];
  const filteredRewards = search
    ? rewards.filter((reward) => matchesRewardSearch(reward, search))
    : rewards;
  const statusMessage = getStatusMessage(params.status);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Prêmios" />

      {statusMessage ? (
        <Alert
          variant={
            params.status?.includes("error") || params.status === "invalid"
              ? "error"
              : "success"
          }
        >
          {statusMessage}
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Não foi possível carregar os prêmios">
          Tente novamente em alguns instantes.
        </Alert>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.38fr)_minmax(0,0.62fr)] xl:items-start">
        <Card className="overflow-hidden xl:sticky xl:top-28">
          <CardHeader className="p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                Cadastro
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Novo prêmio
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <RewardForm mode="create" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                  Catálogo
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Prêmios cadastrados
                </h2>
              </div>
              <Badge className="w-fit px-2.5 py-0.5">
                {filteredRewards.length}{" "}
                {filteredRewards.length === 1 ? "prêmio" : "prêmios"}
              </Badge>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="reward-search">
                Buscar prêmios
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="reward-search"
                  name="q"
                  defaultValue={search}
                  className="h-10 w-full rounded-md border border-lindao-line bg-white py-2 pl-9 pr-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                  placeholder="Buscar por prêmio, descrição ou pontos"
                />
              </div>
              <Button type="submit" className="h-10 px-4">
                Buscar
              </Button>
              {search ? (
                <Link
                  href="/admin/premios"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/35 px-4 text-sm font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                >
                  Limpar
                </Link>
              ) : null}
            </form>
          </CardHeader>

          <CardContent className="p-0">
            {filteredRewards.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  eyebrow={search ? "Sem resultados" : "Sem prêmios"}
                  title={
                    search
                      ? "Nenhum prêmio encontrado"
                      : "Nenhum prêmio cadastrado"
                  }
                  description={
                    search
                      ? "Tente buscar por outro termo."
                      : "Cadastre o primeiro prêmio para iniciar o catálogo."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                <div className="hidden grid-cols-[minmax(180px,1.4fr)_96px_92px_150px] gap-3 bg-white/[0.035] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
                  <span>Prêmio</span>
                  <span className="text-right">Pontos</span>
                  <span>Status</span>
                  <span className="text-right">Ações</span>
                </div>

                {filteredRewards.map((reward) => (
                  <article
                    key={reward.id}
                    className="px-4 py-3 transition duration-200 hover:bg-white/[0.045]"
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(180px,1.4fr)_96px_92px_150px] lg:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-white">
                          {reward.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-300">
                          {reward.description || "Sem descrição cadastrada."}
                        </p>
                      </div>

                      <div className="min-w-0 lg:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                          Pontos
                        </p>
                        <p className="text-sm font-black text-lindao-gold">
                          {formatPoints(Number(reward.points_required))}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                          Status
                        </p>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                            reward.active
                              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-300"
                              : "border-slate-400/20 bg-white/5 text-slate-300",
                          )}
                        >
                          {reward.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <form action={toggleRewardStatusAction}>
                          <input type="hidden" name="id" value={reward.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={String(reward.active)}
                          />
                          <Button
                            type="submit"
                            variant={reward.active ? "secondary" : "primary"}
                            className="h-8 px-3 text-xs"
                          >
                            {reward.active ? "Inativar" : "Ativar"}
                          </Button>
                        </form>
                      </div>
                    </div>

                    <details className="mt-3">
                      <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-lindao-gold/30 px-3 text-xs font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10">
                        Editar prêmio
                      </summary>
                      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                        <RewardForm
                          cancelHref="/admin/premios"
                          mode="edit"
                          reward={{
                            active: reward.active,
                            description: reward.description,
                            id: reward.id,
                            pointsRequired: Number(reward.points_required),
                            title: reward.name,
                          }}
                        />
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
