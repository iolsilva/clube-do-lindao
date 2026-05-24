import { BadgeCheck, Gift, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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

  return (
    <PublicShell>
      <section className="relative overflow-hidden rounded-lg border border-lindao-gold/35 bg-[radial-gradient(circle_at_84%_18%,rgba(245,197,24,0.16),transparent_14rem),radial-gradient(circle_at_12%_0%,rgba(37,99,235,0.32),transparent_18rem),linear-gradient(135deg,#1843b8_0%,#10275f_48%,#060f2e_100%)] p-5 shadow-[0_24px_74px_rgba(0,0,0,0.3)] sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full border border-lindao-gold/30 bg-lindao-gold/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 right-10 hidden size-24 rounded-full border border-white/15 bg-lindao-blue/20 shadow-[0_0_70px_rgba(245,197,24,0.22)] sm:block"
        />

        <div className="relative z-[1] max-w-2xl space-y-3">
          <Badge>Área pública</Badge>
          <div>
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              Prêmios
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Confira as vantagens disponíveis para resgate.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <Alert variant="error" title="Não foi possível carregar os prêmios">
          Tente novamente em alguns instantes.
        </Alert>
      ) : rewards.length === 0 ? (
        <EmptyState
          eyebrow="Sem prêmios"
          title="Nenhum prêmio ativo"
          description="Novas vantagens aparecem aqui quando forem ativadas."
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden">
              <CardContent className="grid min-h-56 content-between gap-6 p-5">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-md border border-lindao-gold/30 bg-lindao-gold/10 text-lindao-gold">
                      <Gift
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={2.4}
                      />
                    </span>
                    <Badge className="gap-1.5 px-2.5 py-0.5">
                      <BadgeCheck
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={2.6}
                      />
                      Ativo
                    </Badge>
                  </div>

                  <div>
                    <h2 className="line-clamp-2 text-xl font-black text-white">
                      {reward.name}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
                      {reward.description || "Vantagem disponível para troca."}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-lindao-gold/25 bg-lindao-gold/10 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      aria-hidden="true"
                      className="size-4 text-lindao-gold"
                      strokeWidth={2.4}
                    />
                    <p className="text-xs font-black uppercase tracking-wide text-slate-300">
                      Pontos necessários
                    </p>
                  </div>
                  <p className="mt-2 text-3xl font-black text-lindao-gold">
                    {formatPoints(Number(reward.points_required))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </PublicShell>
  );
}
