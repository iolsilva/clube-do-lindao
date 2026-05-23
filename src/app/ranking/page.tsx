import { PublicShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RankingPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Área pública"
        title="Ranking"
        description="Clientes poderão acompanhar sua posição no Clube do Lindão sem precisar fazer login."
      />
      <EmptyState
        eyebrow="Em breve"
        title="Ranking ainda sem dados"
        description="A listagem pública será ligada ao banco de dados e às regras de pontuação na próxima fase."
      />
    </PublicShell>
  );
}
