import Link from "next/link";
import { Search } from "lucide-react";
import { deleteLevelAction } from "@/app/admin/niveis/actions";
import { LevelForm } from "@/components/levels/level-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type AdminNiveisPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

type LevelRow = {
  id: string;
  name: string;
  benefit_description: string | null;
  sort_order: number;
};

type CustomerLevelRow = {
  level_id: string | null;
};

function getStatusMessage(status?: string) {
  const messages: Record<string, string> = {
    created: "Nível criado com sucesso.",
    deleted: "Nível excluído com sucesso.",
    "delete-error": "Não foi possível excluir o nível.",
    invalid: "Nível inválido.",
    "in-use": "Este nível está em uso e não pode ser excluído.",
    updated: "Nível atualizado com sucesso.",
  };

  return status ? messages[status] : undefined;
}

function matchesLevelSearch(level: LevelRow, search: string) {
  const normalizedSearch = search.toLowerCase();

  return (
    level.name.toLowerCase().includes(normalizedSearch) ||
    (level.benefit_description ?? "").toLowerCase().includes(normalizedSearch) ||
    String(level.sort_order).includes(normalizedSearch)
  );
}

export default async function AdminNiveisPage({
  searchParams,
}: AdminNiveisPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const supabase = await createClient();
  const [
    { data: levelsData, error: levelsError },
    { data: customersData, error: customersError },
  ] = await Promise.all([
    supabase
      .from("levels")
      .select("id, name, benefit_description, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("customers").select("level_id"),
  ]);

  const levels = (levelsData ?? []) as LevelRow[];
  const filteredLevels = search
    ? levels.filter((level) => matchesLevelSearch(level, search))
    : levels;
  const customers = (customersData ?? []) as CustomerLevelRow[];
  const usageByLevel = customers.reduce<Record<string, number>>(
    (accumulator, customer) => {
      if (customer.level_id) {
        accumulator[customer.level_id] =
          (accumulator[customer.level_id] ?? 0) + 1;
      }

      return accumulator;
    },
    {},
  );
  const statusMessage = getStatusMessage(params.status);
  const loadError = levelsError?.message ?? customersError?.message;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Níveis" />

      {statusMessage ? (
        <Alert
          variant={
            params.status?.includes("error") ||
            params.status === "invalid" ||
            params.status === "in-use"
              ? "error"
              : "success"
          }
        >
          {statusMessage}
        </Alert>
      ) : null}

      {loadError ? (
        <Alert variant="error" title="Não foi possível carregar os níveis">
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
                Novo nível
              </h2>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <LevelForm mode="create" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                  Estrutura
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Níveis cadastrados
                </h2>
              </div>
              <Badge className="w-fit px-2.5 py-0.5">
                {filteredLevels.length}{" "}
                {filteredLevels.length === 1 ? "nível" : "níveis"}
              </Badge>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="level-search">
                Buscar níveis
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="level-search"
                  name="q"
                  defaultValue={search}
                  className="h-10 w-full rounded-md border border-lindao-line bg-white py-2 pl-9 pr-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                  placeholder="Buscar por nível, descrição ou ordem"
                />
              </div>
              <Button type="submit" className="h-10 px-4">
                Buscar
              </Button>
              {search ? (
                <Link
                  href="/admin/niveis"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/35 px-4 text-sm font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                >
                  Limpar
                </Link>
              ) : null}
            </form>
          </CardHeader>

          <CardContent className="p-0">
            {filteredLevels.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  eyebrow={search ? "Sem resultados" : "Sem níveis"}
                  title={
                    search
                      ? "Nenhum nível encontrado"
                      : "Nenhum nível cadastrado"
                  }
                  description={
                    search
                      ? "Tente buscar por outro termo."
                      : "Cadastre o primeiro nível para organizar os clientes."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                <div className="hidden grid-cols-[minmax(150px,1fr)_minmax(170px,1.25fr)_76px_150px] gap-3 bg-white/[0.035] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
                  <span>Nível</span>
                  <span>Descrição</span>
                  <span className="text-right">Ordem</span>
                  <span className="text-right">Ações</span>
                </div>

                {filteredLevels.map((level) => {
                  const usageCount = usageByLevel[level.id] ?? 0;

                  return (
                    <article
                      key={level.id}
                      className="px-4 py-3 transition duration-200 hover:bg-white/[0.045]"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(150px,1fr)_minmax(170px,1.25fr)_76px_150px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="px-2.5 py-0.5">
                              Ordem {level.sort_order}
                            </Badge>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                                usageCount > 0
                                  ? "border-lindao-gold/30 bg-lindao-gold/10 text-lindao-gold"
                                  : "border-slate-400/20 bg-white/5 text-slate-300",
                              )}
                            >
                              {usageCount} cliente
                              {usageCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          <h3 className="mt-2 truncate text-sm font-black text-white">
                            {level.name}
                          </h3>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Descrição
                          </p>
                          <p className="line-clamp-2 text-sm leading-5 text-slate-300">
                            {level.benefit_description ||
                              "Sem descrição cadastrada."}
                          </p>
                        </div>

                        <div className="min-w-0 lg:text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Ordem
                          </p>
                          <p className="text-sm font-black text-lindao-gold">
                            {level.sort_order}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <form action={deleteLevelAction}>
                            <input type="hidden" name="id" value={level.id} />
                            <Button
                              type="submit"
                              variant="secondary"
                              disabled={usageCount > 0}
                              className="h-8 px-3 text-xs"
                            >
                              Excluir
                            </Button>
                          </form>
                        </div>
                      </div>

                      <details className="mt-3">
                        <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-lindao-gold/30 px-3 text-xs font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10">
                          Editar nível
                        </summary>
                        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                          <LevelForm
                            cancelHref="/admin/niveis"
                            mode="edit"
                            level={{
                              description: level.benefit_description,
                              id: level.id,
                              name: level.name,
                              sortOrder: level.sort_order,
                            }}
                          />
                        </div>
                      </details>
                    </article>
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
