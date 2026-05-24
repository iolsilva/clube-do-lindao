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
    activated: "Premio ativado com sucesso.",
    created: "Premio criado com sucesso.",
    deactivated: "Premio inativado com sucesso.",
    invalid: "Premio invalido.",
    "status-error": "Nao foi possivel alterar o status do premio.",
    updated: "Premio atualizado com sucesso.",
  };

  return status ? messages[status] : undefined;
}

export default async function AdminPremiosPage({
  searchParams,
}: AdminPremiosPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("id, name, description, points_required, active")
    .order("active", { ascending: false })
    .order("points_required", { ascending: true })
    .order("name", { ascending: true });

  const rewards = (data ?? []) as RewardRow[];
  const activeRewards = rewards.filter((reward) => reward.active).length;
  const statusMessage = getStatusMessage(params.status);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Premios"
        description="Cadastre, edite e controle os premios disponiveis para clientes."
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

      {error ? (
        <Alert variant="error" title="Nao foi possivel carregar os premios">
          Nao foi possivel carregar os premios. Confira as permissoes do
          usuario admin no Supabase.
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Premios cadastrados
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {rewards.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Ativos
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {activeRewards}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Inativos
            </p>
            <p className="mt-2 text-3xl font-black text-lindao-navy">
              {rewards.length - activeRewards}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-lindao-navy">Novo premio</h2>
            <p className="text-sm leading-6 text-slate-600">
              Apenas premios ativos aparecem na pagina publica.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <RewardForm mode="create" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-lindao-navy">
                Premios cadastrados
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Gerencie disponibilidade e pontos necessarios.
              </p>
            </div>
            <Badge>{rewards.length} premios</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <EmptyState
              eyebrow="Sem premios"
              title="Nenhum premio cadastrado"
              description="Use o formulario acima para criar o primeiro premio."
            />
          ) : (
            <div className="grid gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="grid gap-5 rounded-lg border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>
                          {formatPoints(Number(reward.points_required))} pts
                        </Badge>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                            reward.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {reward.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-lindao-navy">
                          {reward.name}
                        </h3>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                          {reward.description || "Sem descricao cadastrada."}
                        </p>
                      </div>
                    </div>

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
                      >
                        {reward.active ? "Inativar" : "Ativar"}
                      </Button>
                    </form>
                  </div>

                  <details>
                    <summary className="cursor-pointer text-sm font-bold text-lindao-blue hover:text-lindao-navy">
                      Editar premio
                    </summary>
                    <div className="mt-5 border-t border-lindao-line pt-5">
                      <RewardForm
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
