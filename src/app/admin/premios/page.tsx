import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminPremiosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Prêmios"
        description="Gestão futura dos prêmios disponíveis para os clientes."
      />
      <EmptyState
        eyebrow="Sem CRUD"
        title="Cadastro de prêmios ainda vazio"
        description="A criação e manutenção dos prêmios serão adicionadas em uma próxima etapa."
      />
    </>
  );
}
