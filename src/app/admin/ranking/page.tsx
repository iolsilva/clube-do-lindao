import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  formatDocument,
  formatPhone,
  formatPoints,
  onlyDigits,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type AdminRankingPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

type AdminRankingRow = {
  ranking_position: number;
  customer_id: string;
  customer_code: string | null;
  customer_name: string;
  document_type: "cpf" | "cnpj";
  document: string;
  phone: string | null;
  active: boolean;
  level_name: string | null;
  total_points: string | number;
  available_points: string | number;
  redeemed_points: string | number;
};

function buildSearchFilter(search: string) {
  const textSearch = search
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const digitSearch = onlyDigits(search);
  const filters: string[] = [];

  if (textSearch) {
    filters.push(`customer_name.ilike.%${textSearch}%`);
    filters.push(`customer_code.ilike.%${textSearch}%`);
    filters.push(`level_name.ilike.%${textSearch}%`);
  }

  if (digitSearch) {
    filters.push(`document.ilike.%${digitSearch}%`);
    filters.push(`phone.ilike.%${digitSearch}%`);
  }

  return filters.join(",");
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "Ativos";
  }

  if (status === "inactive") {
    return "Inativos";
  }

  return "Todos";
}

export default async function AdminRankingPage({
  searchParams,
}: AdminRankingPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = params.status ?? "all";
  const supabase = await createClient();

  let rankingQuery = supabase
    .from("customer_points_view")
    .select(
      "ranking_position, customer_id, customer_code, customer_name, document_type, document, phone, active, level_name, total_points, available_points, redeemed_points",
    )
    .order("ranking_position", { ascending: true })
    .order("customer_name", { ascending: true });

  const searchFilter = buildSearchFilter(search);

  if (searchFilter) {
    rankingQuery = rankingQuery.or(searchFilter);
  }

  if (status === "active") {
    rankingQuery = rankingQuery.eq("active", true);
  }

  if (status === "inactive") {
    rankingQuery = rankingQuery.eq("active", false);
  }

  const { data, error } = await rankingQuery;
  const ranking = (data ?? []) as AdminRankingRow[];

  const activeCustomers = ranking.filter((row) => row.active).length;
  const totalPoints = ranking.reduce(
    (sum, row) => sum + Number(row.total_points),
    0,
  );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Ranking" />

      {error ? (
        <Alert variant="error" title="Nao foi possivel carregar o ranking">
          Tente novamente em alguns instantes.
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Clientes listados
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {ranking.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Ativos no resultado
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {activeCustomers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pontos totais
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {formatPoints(totalPoints)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-lindao-navy">
            Buscar e filtrar
          </h2>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
            <label className="sr-only" htmlFor="ranking-search">
              Buscar ranking
            </label>
            <input
              id="ranking-search"
              name="q"
              defaultValue={search}
              className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
              placeholder="Nome, codigo, nivel, documento ou telefone"
            />
            <label className="sr-only" htmlFor="ranking-status">
              Status
            </label>
            <select
              id="ranking-status"
              name="status"
              defaultValue={status}
              className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <Button type="submit">Filtrar</Button>
            {search || status !== "all" ? (
              <Link
                href="/admin/ranking"
                className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/30 px-4 text-sm font-semibold text-lindao-gold transition-colors hover:bg-lindao-gold/10"
              >
                Limpar
              </Link>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-lindao-navy">
                Ranking completo
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Filtro atual: {getStatusLabel(status)}.
              </p>
            </div>
            <Badge>{ranking.length} clientes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <EmptyState
              eyebrow="Sem resultados"
              title="Nenhum cliente encontrado"
              description="Tente alterar a busca ou o filtro de status."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-lindao-line text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">Posicao</th>
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Documento</th>
                    <th className="py-3 pr-4">Telefone</th>
                    <th className="py-3 pr-4">Nivel</th>
                    <th className="py-3 pr-4">Pontos</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="border-b border-lindao-line last:border-0"
                    >
                      <td className="py-4 pr-4">
                        <span className="flex size-10 items-center justify-center rounded-md bg-lindao-blue text-sm font-black text-white">
                          {customer.ranking_position}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-bold text-lindao-navy">
                          {customer.customer_name}
                        </div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {customer.customer_code ?? "Sem codigo"}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {formatDocument(
                          customer.document,
                          customer.document_type,
                        )}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {customer.phone ? formatPhone(customer.phone) : "-"}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {customer.level_name ?? "Sem nivel"}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-black text-lindao-blue">
                          {formatPoints(Number(customer.total_points))}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatPoints(Number(customer.available_points))} disp.
                        </div>
                      </td>
                      <td className="py-4 pr-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
