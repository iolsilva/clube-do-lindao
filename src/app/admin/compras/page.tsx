import Link from "next/link";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
        <Alert variant="error" title="Nao foi possivel carregar as compras">
          Tente novamente em alguns instantes.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-lindao-navy">
            Buscar cliente
          </h2>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="purchase-customer-search">
              Buscar cliente
            </label>
            <input
              id="purchase-customer-search"
              name="q"
              defaultValue={search}
              className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
              placeholder="Nome, documento, telefone ou codigo"
            />
            <Button type="submit">Buscar</Button>
            {search || selectedCustomerId ? (
              <Link
                href="/admin/compras"
                className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/30 px-4 text-sm font-semibold text-lindao-gold transition-colors hover:bg-lindao-gold/10"
              >
                Limpar
              </Link>
            ) : null}
          </form>

          {search ? (
            customers.length > 0 ? (
              <div className="grid gap-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className={cn(
                      "grid gap-4 rounded-md border p-4 md:grid-cols-[1fr_auto]",
                      selectedCustomerId === customer.id
                        ? "border-lindao-gold/50 bg-lindao-gold/10"
                        : "border-white/10 bg-white/5",
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{customer.code ?? "Sem codigo"}</Badge>
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
                      <div>
                        <p className="font-bold text-lindao-navy">
                          {customer.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatDocument(
                            customer.document,
                            customer.document_type,
                          )}{" "}
                          | {formatPhone(customer.phone)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/compras?customerId=${customer.id}&q=${encodeURIComponent(search)}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-lindao-blue px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-lindao-navy"
                    >
                      Selecionar
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Sem resultados"
                title="Nenhum cliente encontrado"
                description="Tente buscar por outro nome, CPF/CNPJ, telefone ou codigo."
              />
            )
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-lindao-navy">Nova compra</h2>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              selectedCustomer.active ? (
                <div className="grid gap-5">
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <Badge>{selectedCustomer.code ?? "Sem codigo"}</Badge>
                    <h3 className="mt-3 text-lg font-bold text-lindao-navy">
                      {selectedCustomer.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDocument(
                        selectedCustomer.document,
                        selectedCustomer.document_type,
                      )}{" "}
                      | {formatPhone(selectedCustomer.phone)}
                    </p>
                  </div>
                  <PurchaseForm
                    customerId={selectedCustomer.id}
                    defaultPurchasedAt={toDateTimeLocalValue()}
                  />
                </div>
              ) : (
                <EmptyState
                  eyebrow="Cliente inativo"
                  title="Ative o cliente antes de registrar compras"
                  description="Compras novas ficam bloqueadas para clientes inativos."
                />
              )
            ) : (
              <EmptyState
                eyebrow="Selecione um cliente"
                title="Nenhum cliente selecionado"
                description="Use a busca acima para encontrar o cliente e registrar a compra."
              />
            )}
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-lindao-navy">
              Historico de compras
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              {selectedCustomer
                ? `Compras recentes de ${selectedCustomer.name}.`
                : "Ultimas compras registradas no clube."}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <EmptyState
              eyebrow="Sem historico"
              title="Nenhuma compra registrada"
              description={
                selectedCustomer
                  ? "Registre a primeira compra deste cliente usando o formulario acima."
                  : "Selecione um cliente e registre uma compra para iniciar o historico."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-lindao-line text-xs font-bold uppercase tracking-wide text-lindao-muted">
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Cliente</th>
                    <th className="py-3 pr-4">Valor</th>
                    <th className="py-3 pr-4">Pontos</th>
                    <th className="py-3 pr-4">Observacoes</th>
                  </tr>
                </thead>
                <tbody>
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
                        className="border-b border-lindao-line last:border-0"
                      >
                        <td className="py-4 pr-4 font-medium text-slate-100">
                          {formatDateTime(purchase.purchased_at)}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-white">
                            {customer?.name ?? "Cliente removido"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {customer?.code ?? ""}
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-emerald-300">
                          {formatCurrencyFromCents(purchase.amount_cents)}
                        </td>
                        <td className="py-4 pr-4 font-bold text-lindao-gold">
                          {formatPoints(points)} pontos
                        </td>
                        <td className="py-4 pr-4 text-slate-300">
                          {purchase.notes || "-"}
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
    </>
  );
}
