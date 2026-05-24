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
    created: "Nivel criado com sucesso.",
    deleted: "Nivel excluido com sucesso.",
    "delete-error": "Nao foi possivel excluir o nivel.",
    invalid: "Nivel invalido.",
    "in-use": "Este nivel esta em uso e nao pode ser excluido.",
    updated: "Nivel atualizado com sucesso.",
  };

  return status ? messages[status] : undefined;
}

export default async function AdminNiveisPage({
  searchParams,
}: AdminNiveisPageProps) {
  const params = await searchParams;
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
      <PageHeader
        eyebrow="Admin"
        title="Niveis"
        description="Crie e ordene os niveis usados para classificar clientes no Clube do Lindao."
      />

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
        <Alert variant="error" title="Nao foi possivel carregar os niveis">
          Nao foi possivel carregar os niveis. Confira as permissoes do usuario
          admin no Supabase.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-lindao-navy">Novo nivel</h2>
            <p className="text-sm leading-6 text-slate-600">
              A ordem define como os niveis aparecem nos cadastros e filtros.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <LevelForm mode="create" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-lindao-navy">
                Niveis cadastrados
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Niveis em uso por clientes nao podem ser excluidos.
              </p>
            </div>
            <Badge>{levels.length} niveis</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {levels.length === 0 ? (
            <EmptyState
              eyebrow="Sem niveis"
              title="Nenhum nivel cadastrado"
              description="Use o formulario acima para criar o primeiro nivel."
            />
          ) : (
            <div className="grid gap-4">
              {levels.map((level) => {
                const usageCount = usageByLevel[level.id] ?? 0;

                return (
                  <div
                    key={level.id}
                    className="grid gap-5 rounded-lg border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>Ordem {level.sort_order}</Badge>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              usageCount > 0
                                ? "bg-lindao-blue-soft text-lindao-blue"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {usageCount} cliente{usageCount === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-lindao-navy">
                            {level.name}
                          </h3>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                            {level.benefit_description ||
                              "Sem descricao cadastrada."}
                          </p>
                        </div>
                      </div>

                      <form action={deleteLevelAction}>
                        <input type="hidden" name="id" value={level.id} />
                        <Button
                          type="submit"
                          variant="secondary"
                          disabled={usageCount > 0}
                        >
                          Excluir
                        </Button>
                      </form>
                    </div>

                    <details>
                      <summary className="cursor-pointer text-sm font-bold text-lindao-blue hover:text-lindao-navy">
                        Editar nivel
                      </summary>
                      <div className="mt-5 border-t border-lindao-line pt-5">
                        <LevelForm
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
