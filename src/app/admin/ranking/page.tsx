import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminRankingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Ranking"
        description="Acompanhamento interno da pontuação e colocação dos clientes."
      />
      <EmptyState
        eyebrow="Sem dados"
        title="Ranking administrativo aguardando pontuação"
        description="A ordenação e os empates serão definidos na camada de dados para manter a regra consistente."
      />
    </>
  );
}
