import Link from "next/link";
import { Search } from "lucide-react";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  calculatePointsFromCents,
  formatCurrencyFromCents,
  formatDateTime,
  formatDocument,
  formatPhone,
  formatPoints,
  onlyDigits,
  toDateTimeLocalValue,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type AdminComprasPageProps = {
  searchParams: Promise<{
    customerId?: string;
    q?: string;
    status?: string;
  }>;
};

type CustomerSearchRow = {
  id: string;
  code: string | null;
  name: string;
  document_type: "cpf" | "cnpj";
  document: string;
  phone: string;
  active: boolean;
};

type PurchaseRow = {
  id: string;
  amount_cents: number;
  points: string | number | null;
  purchased_at: string;
  notes: string | null;
  customers: CustomerSearchRow | CustomerSearchRow[] | null;
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

function getCustomerFromPurchase(customer: PurchaseRow["customers"]) {
  if (Array.isArray(customer)) {
    return customer[0] ?? null;
  }

  return customer;
}

function getStatusMessage(status?: string) {
  const messages: Record<string, string> = {
    created: "Compra registrada com sucesso.",
  };

  return status ? messages[status] : undefined;
}

function CompactEmptyState({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-lindao-gold/25 bg-white/[0.025] p-4">
      <Badge className="px-2.5 py-0.5">{eyebrow}</Badge>
      <h3 className="mt-3 text-base font-black text-white">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-300">{description}</p>
    </div>
  );
}

function CustomerSummary({ customer }: { customer: CustomerSearchRow }) {
  return (
    <div className="rounded-lg border border-lindao-gold/20 bg-lindao-gold/10 p-3">
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
      <h3 className="mt-2 line-clamp-2 text-base font-black text-white">
        {customer.name}
      </h3>
      <p className="mt-1 text-sm leading-5 text-slate-300">
        {formatDocument(customer.document, customer.document_type)} |{" "}
        {formatPhone(customer.phone)}
      </p>
    </div>
  );
}

export default async function AdminComprasPage({
  searchParams,
}: AdminComprasPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const selectedCustomerId = params.customerId?.trim() ?? "";
  const supabase = await createClient();

  const searchFilter = buildSearchFilter(search);
  const customersPromise = searchFilter
    ? supabase
        .from("customers")
        .select("id, code, name, document_type, document, phone, active")
        .or(searchFilter)
        .order("name", { ascending: true })
        .limit(12)
    : Promise.resolve({ data: [], error: null });

  const selectedCustomerPromise = selectedCustomerId
    ? supabase
        .from("customers")
        .select("id, code, name, document_type, document, phone, active")
        .eq("id", selectedCustomerId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  let purchasesQuery = supabase
    .from("purchases")
    .select(
      "id, amount_cents, points, purchased_at, notes, customers(id, code, name, document_type, document, phone, active)",
    )
    .order("purchased_at", { ascending: false })
    .limit(25);

  if (selectedCustomerId) {
    purchasesQuery = purchasesQuery.eq("customer_id", selectedCustomerId);
  }

  const [
    { data: customersData, error: customersError },
    { data: selectedCustomerData, error: selectedCustomerError },
    { data: purchasesData, error: purchasesError },
  ] = await Promise.all([
    customersPromise,
    selectedCustomerPromise,
    purchasesQuery,
  ]);

  const customers = (customersData ?? []) as CustomerSearchRow[];
  const selectedCustomer = selectedCustomerData as CustomerSearchRow | null;
  const purchases = (purchasesData ?? []) as PurchaseRow[];
  const statusMessage = getStatusMessage(params.status);
  const loadError =
    customersError?.message ??
    selectedCustomerError?.message ??
    purchasesError?.message;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Compras" />

      {statusMessage ? (
        <Alert variant="success">{statusMessage}</Alert>
      ) : null}

      {loadError ? (
        <Alert variant="error" title="Não foi possível carregar as compras">
          Tente novamente em alguns instantes.
        </Alert>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(300px,0.38fr)_minmax(0,0.62fr)] xl:items-start">
        <Card className="overflow-hidden xl:sticky xl:top-28">
          <CardHeader className="p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                Lançamento
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Nova compra
              </h2>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-4">
            {selectedCustomer ? (
              selectedCustomer.active ? (
                <>
                  <CustomerSummary customer={selectedCustomer} />
                  <PurchaseForm
                    customerId={selectedCustomer.id}
                    defaultPurchasedAt={toDateTimeLocalValue()}
                  />
                </>
              ) : (
                <CompactEmptyState
                  eyebrow="Cliente inativo"
                  title="Compra bloqueada"
                  description="Ative o cliente antes de registrar uma nova compra."
                />
              )
            ) : (
              <CompactEmptyState
                eyebrow="Selecione um cliente"
                title="Nenhum cliente selecionado"
                description="Busque e selecione o cliente para registrar a compra."
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                    Cliente
                  </p>
                  <h2 className="mt-1 text-lg font-black text-white">
                    Buscar cliente
                  </h2>
                </div>
                {search ? (
                  <Badge className="w-fit px-2.5 py-0.5">
                    {customers.length}{" "}
                    {customers.length === 1 ? "resultado" : "resultados"}
                  </Badge>
                ) : null}
              </div>

              <form className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="purchase-customer-search">
                  Buscar cliente
                </label>
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="purchase-customer-search"
                    name="q"
                    defaultValue={search}
                    className="h-10 w-full rounded-md border border-lindao-line bg-white py-2 pl-9 pr-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                    placeholder="Nome, documento, telefone ou código"
                  />
                </div>
                <Button type="submit" className="h-10 px-4">
                  Buscar
                </Button>
                {search || selectedCustomerId ? (
                  <Link
                    href="/admin/compras"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/35 px-4 text-sm font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                  >
                    Limpar
                  </Link>
                ) : null}
              </form>
            </CardHeader>

            <CardContent className="p-0">
              {!search ? (
                <div className="p-4">
                  <CompactEmptyState
                    eyebrow="Busca"
                    title="Encontre um cliente"
                    description="Pesquise por nome, documento, telefone ou código."
                  />
                </div>
              ) : customers.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {customers.map((customer) => (
                    <article
                      key={customer.id}
                      className={cn(
                        "grid gap-3 px-4 py-3 transition duration-200 hover:bg-white/[0.045] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center",
                        selectedCustomerId === customer.id
                          ? "bg-lindao-gold/10"
                          : null,
                      )}
                    >
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
                        <p className="mt-1 truncate text-sm text-slate-300">
                          {formatDocument(
                            customer.document,
                            customer.document_type,
                          )}{" "}
                          | {formatPhone(customer.phone)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/compras?customerId=${customer.id}&q=${encodeURIComponent(search)}`}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-lindao-gold/30 px-3 text-xs font-black text-lindao-gold transition duration-200 hover:-translate-y-0.5 hover:bg-lindao-gold/10"
                      >
                        Selecionar
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <CompactEmptyState
                    eyebrow="Sem resultados"
                    title="Nenhum cliente encontrado"
                    description="Tente buscar por outro nome, documento, telefone ou código."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                    Movimentação
                  </p>
                  <h2 className="mt-1 text-lg font-black text-white">
                    Histórico de compras
                  </h2>
                </div>
                <Badge className="w-fit px-2.5 py-0.5">
                  {purchases.length}{" "}
                  {purchases.length === 1 ? "compra" : "compras"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {purchases.length === 0 ? (
                <div className="p-4">
                  <CompactEmptyState
                    eyebrow="Sem histórico"
                    title="Nenhuma compra registrada"
                    description={
                      selectedCustomer
                        ? "Registre a primeira compra deste cliente."
                        : "Selecione um cliente e registre uma compra."
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.035] text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        <th className="px-4 py-3 text-lindao-gold">Data</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3 text-lindao-gold">Pontos</th>
                        <th className="px-4 py-3">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {purchases.map((purchase) => {
                        const customer = getCustomerFromPurchase(
                          purchase.customers,
                        );
                        const points =
                          purchase.points === null
                            ? calculatePointsFromCents(purchase.amount_cents)
                            : Number(purchase.points);

                        return (
                          <tr
                            key={purchase.id}
                            className="transition duration-200 hover:bg-white/[0.045]"
                          >
                            <td className="px-4 py-3 font-semibold text-slate-100">
                              {formatDateTime(purchase.purchased_at)}
                            </td>
                            <td className="max-w-[210px] px-4 py-3">
                              <p className="truncate font-black text-white">
                                {customer?.name ?? "Cliente removido"}
                              </p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {customer?.code ?? ""}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-black text-emerald-300">
                              {formatCurrencyFromCents(purchase.amount_cents)}
                            </td>
                            <td className="px-4 py-3 font-black text-lindao-gold">
                              {formatPoints(points)}
                            </td>
                            <td className="max-w-[220px] px-4 py-3">
                              <p className="truncate text-slate-300">
                                {purchase.notes || "-"}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
