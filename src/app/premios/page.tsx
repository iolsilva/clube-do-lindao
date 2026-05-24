import { PublicShell } from "@/components/layout/public-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatPoints } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";

type PublicRewardRow = {
  description: string | null;
  id: string;
  name: string;
  points_required: string | number;
};

export default async function PremiosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("id, name, description, points_required")
    .eq("active", true)
    .order("points_required", { ascending: true })
    .order("name", { ascending: true });

  const rewards = (data ?? []) as PublicRewardRow[];
  const featuredReward = rewards[0];

  return (
    <PublicShell>
      <PageHeader
        eyebrow="Area publica"
        title="Premios"
        description="Veja os premios ativos disponiveis para troca no Clube do Lindao."
      />

      {error ? (
        <Alert variant="error" title="Nao foi possivel carregar os premios">
          Nao foi possivel carregar os premios agora.
        </Alert>
      ) : rewards.length === 0 ? (
        <EmptyState
          eyebrow="Sem premios"
          title="Nenhum premio ativo"
          description="Novos premios aparecem aqui assim que forem ativados pela administracao."
        />
      ) : (
        <>
          {featuredReward ? (
            <section className="overflow-hidden rounded-lg border border-lindao-gold bg-lindao-gold-soft">
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
                <div className="space-y-4">
                  <Badge>Menor pontuacao</Badge>
                  <div>
                    <h2 className="text-3xl font-black text-lindao-navy">
                      {featuredReward.name}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                      {featuredReward.description ||
                        "Premio ativo disponivel para clientes participantes."}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-white/80 p-5 text-left md:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pontos necessarios
                  </p>
                  <p className="mt-2 text-4xl font-black text-lindao-navy">
                    {formatPoints(Number(featuredReward.points_required))}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className="overflow-hidden">
                <CardContent className="grid min-h-64 content-between gap-8">
                  <div className="space-y-4">
                    <Badge>Premio ativo</Badge>
                    <div>
                      <h2 className="text-2xl font-black text-lindao-navy">
                        {reward.name}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {reward.description ||
                          "Premio disponivel para troca por pontos."}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md bg-lindao-blue-soft p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-lindao-blue">
                      Pontos necessarios
                    </p>
                    <p className="mt-1 text-3xl font-black text-lindao-navy">
                      {formatPoints(Number(reward.points_required))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}
    </PublicShell>
  );
}
