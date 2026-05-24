import Link from "next/link";
import { Search } from "lucide-react";
import { toggleCustomerStatusAction } from "@/app/admin/clientes/actions";
import {
  CustomerForm,
  type CustomerFormCustomer,
  type LevelOption,
} from "@/components/customers/customer-form";
import { CustomerRedemptionDialog } from "@/components/customers/customer-redemption-dialog";
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

type AdminClientesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

type CustomerRow = {
  id: string;
  code: string | null;
  name: string;
  document_type: "cpf" | "cnpj";
  document: string;
  phone: string;
  level_id: string | null;
  active: boolean;
  levels: { name: string } | Array<{ name: string }> | null;
};

type CustomerPointsRow = {
  available_points: string | number | null;
  customer_id: string;
  total_points: string | number | null;
};

function buildSearchFilter(search: string) {
  const textSearch = search
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const digitSearch = onlyDigits(search);
  const filters: string[] = [];

  if (textSearch) {
    filters.push(`name.ilike.%${textSearch}%`);
    filters.push(`code.ilike.%${textSearch}%`);
  }

  if (digitSearch) {
    filters.push(`document.ilike.%${digitSearch}%`);
    filters.push(`phone.ilike.%${digitSearch}%`);
  }

  return filters.join(",");
}

function getLevelName(levels: CustomerRow["levels"]) {
  if (Array.isArray(levels)) {
    return levels[0]?.name ?? "Sem nível";
  }

  return levels?.name ?? "Sem nível";
}

function getStatusMessage(status?: string) {
  const messages: Record<string, string> = {
    activated: "Cliente ativado com sucesso.",
    created: "Cliente cadastrado com sucesso.",
    deactivated: "Cliente inativado com sucesso.",
    invalid: "Cliente inválido.",
    redeemed: "Resgate registrado com sucesso.",
    "status-error": "Não foi possível alterar o status do cliente.",
    updated: "Cliente atualizado com sucesso.",
  };

  return status ? messages[status] : undefined;
}

function toFormCustomer(customer: CustomerRow): CustomerFormCustomer {
  return {
    id: customer.id,
    code: customer.code,
    name: customer.name,
    documentType: customer.document_type,
    document: customer.document,
    phone: customer.phone,
    levelId: customer.level_id,
    active: customer.active,
  };
}

function getAvailablePoints(points?: CustomerPointsRow) {
  return Math.max(
    Number(points?.available_points ?? points?.total_points ?? 0),
    0,
  );
}

export default async function AdminClientesPage({
  searchParams,
}: AdminClientesPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const supabase = await createClient();

  const levelsQuery = supabase
    .from("levels")
    .select("id, name")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  let customersQuery = supabase
    .from("customers")
    .select(
      "id, code, name, document_type, document, phone, level_id, active, levels(name)",
    )
    .order("created_at", { ascending: false });

  const searchFilter = buildSearchFilter(search);

  if (searchFilter) {
    customersQuery = customersQuery.or(searchFilter);
  }

  const [
    { data: levelsData, error: levelsError },
    { data: customersData, error: customersError },
    { data: pointsData, error: pointsError },
  ] = await Promise.all([
    levelsQuery,
    customersQuery,
    supabase
      .from("customer_points_view")
      .select("customer_id, available_points, total_points"),
  ]);

  const levels = (levelsData ?? []) as LevelOption[];
  const customers = (customersData ?? []) as CustomerRow[];
  const pointsByCustomer = new Map(
    ((pointsData ?? []) as CustomerPointsRow[]).map((row) => [
      row.customer_id,
      row,
    ]),
  );
  const statusMessage = getStatusMessage(params.status);
  const loadError =
    customersError?.message ?? levelsError?.message ?? pointsError?.message;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Clientes" />

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

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.38fr)_minmax(0,0.62fr)] xl:items-start">
        <Card className="overflow-hidden xl:sticky xl:top-28">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                  Cadastro
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Novo cliente
                </h2>
              </div>
              <Badge className="px-2.5 py-0.5">Código automático</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <CustomerForm mode="create" levels={levels} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                  Base de clientes
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Clientes cadastrados
                </h2>
              </div>
              <Badge className="w-fit px-2.5 py-0.5">
                {customers.length} {customers.length === 1 ? "cliente" : "clientes"}
              </Badge>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="customer-search">
                Buscar clientes
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  id="customer-search"
                  name="q"
                  defaultValue={search}
                  className="h-10 w-full rounded-md border border-lindao-line bg-white py-2 pl-9 pr-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                  placeholder="Buscar por nome, CPF/CNPJ, telefone ou código"
                />
              </div>
              <Button type="submit" className="h-10 px-4">
                Buscar
              </Button>
              {search ? (
                <Link
                  href="/admin/clientes"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/35 px-4 text-sm font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                >
                  Limpar
                </Link>
              ) : null}
            </form>
          </CardHeader>

          <CardContent className="p-0">
            {loadError ? (
              <div className="p-4">
                <Alert
                  variant="error"
                  title="Não foi possível carregar os clientes"
                >
                  Tente novamente em alguns instantes.
                </Alert>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  eyebrow={search ? "Sem resultados" : "Sem clientes"}
                  title={
                    search
                      ? "Nenhum cliente encontrado"
                      : "Nenhum cliente cadastrado"
                  }
                  description={
                    search
                      ? "Tente buscar por outro nome, documento, telefone ou código."
                      : "Cadastre o primeiro cliente para iniciar a base."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                <div className="hidden grid-cols-[minmax(150px,1.25fr)_minmax(112px,0.85fr)_minmax(104px,0.75fr)_minmax(92px,0.7fr)_84px_150px] gap-3 bg-white/[0.035] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
                  <span>Cliente</span>
                  <span>Documento</span>
                  <span>Telefone</span>
                  <span>Nível</span>
                  <span className="text-right">Pontos</span>
                  <span className="text-right">Ações</span>
                </div>

                {customers.map((customer) => {
                  const availablePoints = getAvailablePoints(
                    pointsByCustomer.get(customer.id),
                  );

                  return (
                    <article
                      key={customer.id}
                      className="px-4 py-3 transition duration-200 hover:bg-white/[0.045]"
                    >
                      <div className="grid gap-3 lg:grid-cols-[minmax(150px,1.25fr)_minmax(112px,0.85fr)_minmax(104px,0.75fr)_minmax(92px,0.7fr)_84px_150px] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="px-2.5 py-0.5">
                              {customer.code ?? "Sem código"}
                            </Badge>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                                customer.active
                                  ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-300"
                                  : "border-slate-400/20 bg-white/5 text-slate-300",
                              )}
                            >
                              {customer.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <h3 className="mt-2 truncate text-sm font-black text-white">
                            {customer.name}
                          </h3>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Documento
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {formatDocument(
                              customer.document,
                              customer.document_type,
                            )}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Telefone
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {formatPhone(customer.phone)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Nível
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {getLevelName(customer.levels)}
                          </p>
                        </div>

                        <div className="min-w-0 lg:text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 lg:hidden">
                            Pontos
                          </p>
                          <p className="text-sm font-black text-lindao-gold">
                            {formatPoints(availablePoints)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <CustomerRedemptionDialog
                            availablePoints={availablePoints}
                            customerCode={customer.code}
                            customerId={customer.id}
                            customerName={customer.name}
                          />
                          <form action={toggleCustomerStatusAction}>
                            <input type="hidden" name="id" value={customer.id} />
                            <input
                              type="hidden"
                              name="active"
                              value={String(customer.active)}
                            />
                            <Button
                              type="submit"
                              variant={customer.active ? "secondary" : "primary"}
                              className="h-8 px-3 text-xs"
                            >
                              {customer.active ? "Inativar" : "Ativar"}
                            </Button>
                          </form>
                        </div>
                      </div>

                      <details className="mt-3">
                        <summary className="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-lindao-gold/30 px-3 text-xs font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10">
                          Editar cliente
                        </summary>
                        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                          <CustomerForm
                            mode="edit"
                            levels={levels}
                            customer={toFormCustomer(customer)}
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
