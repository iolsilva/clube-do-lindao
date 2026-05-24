import Link from "next/link";
import { toggleCustomerStatusAction } from "@/app/admin/clientes/actions";
import {
  CustomerForm,
  type CustomerFormCustomer,
  type LevelOption,
} from "@/components/customers/customer-form";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDocument, formatPhone, onlyDigits } from "@/lib/formatters";
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
    return levels[0]?.name ?? "Sem nivel";
  }

  return levels?.name ?? "Sem nivel";
}

function getStatusMessage(status?: string) {
  const messages: Record<string, string> = {
    activated: "Cliente ativado com sucesso.",
    created: "Cliente cadastrado com sucesso.",
    deactivated: "Cliente inativado com sucesso.",
    invalid: "Cliente invalido.",
    "status-error": "Nao foi possivel alterar o status do cliente.",
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
  ] = await Promise.all([levelsQuery, customersQuery]);

  const levels = (levelsData ?? []) as LevelOption[];
  const customers = (customersData ?? []) as CustomerRow[];
  const statusMessage = getStatusMessage(params.status);
  const loadError = customersError?.message ?? levelsError?.message;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Clientes"
        description="Cadastre, edite, busque e controle os clientes participantes do Clube do Lindao."
      />

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

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-lindao-navy">
              Novo cliente
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              O codigo e gerado automaticamente no formato PrimeiroNome - #001.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" levels={levels} />
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <label className="sr-only" htmlFor="customer-search">
              Buscar clientes
            </label>
            <input
              id="customer-search"
              name="q"
              defaultValue={search}
              className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
              placeholder="Buscar por nome, CPF/CNPJ, telefone ou codigo"
            />
            <Button type="submit">Buscar</Button>
            {search ? (
              <Link
                href="/admin/clientes"
                className="inline-flex h-10 items-center justify-center rounded-md border border-lindao-gold/30 px-4 text-sm font-semibold text-lindao-gold transition-colors hover:bg-lindao-gold/10"
              >
                Limpar
              </Link>
            ) : null}
          </form>
        </div>

        {loadError ? (
          <Alert variant="error" title="Nao foi possivel carregar os clientes">
            Nao foi possivel carregar os clientes. Confira se o usuario logado
            possui perfil de administrador e se o schema do Supabase esta
            atualizado.
          </Alert>
        ) : customers.length === 0 ? (
          <EmptyState
            eyebrow={search ? "Sem resultados" : "Sem clientes"}
            title={
              search
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado"
            }
            description={
              search
                ? "Tente buscar por outro nome, documento, telefone ou codigo."
                : "Use o formulario acima para cadastrar o primeiro cliente."
            }
          />
        ) : (
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="grid gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                        <h2 className="text-xl font-bold text-lindao-navy">
                          {customer.name}
                        </h2>
                        <p className="text-sm text-slate-600">
                          {getLevelName(customer.levels)}
                        </p>
                      </div>
                    </div>

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
                      >
                        {customer.active ? "Inativar" : "Ativar"}
                      </Button>
                    </form>
                  </div>

                  <dl className="grid gap-4 border-y border-lindao-line py-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-semibold text-lindao-navy">
                        Documento
                      </dt>
                      <dd className="mt-1 text-slate-600">
                        {formatDocument(customer.document, customer.document_type)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-lindao-navy">
                        Telefone
                      </dt>
                      <dd className="mt-1 text-slate-600">
                        {formatPhone(customer.phone)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-lindao-navy">Nivel</dt>
                      <dd className="mt-1 text-slate-600">
                        {getLevelName(customer.levels)}
                      </dd>
                    </div>
                  </dl>

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-lindao-blue hover:text-lindao-navy">
                      Editar cliente
                    </summary>
                    <div className="mt-5 border-t border-lindao-line pt-5">
                      <CustomerForm
                        mode="edit"
                        levels={levels}
                        customer={toFormCustomer(customer)}
                      />
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
