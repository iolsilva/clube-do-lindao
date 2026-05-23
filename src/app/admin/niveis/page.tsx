import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminNiveisPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Níveis"
        description="Configuração futura das faixas de benefício do Clube do Lindão."
      />
      <EmptyState
        eyebrow="Sem CRUD"
        title="Níveis ainda não configurados"
        description="As regras e faixas de níveis serão criadas após a modelagem do banco."
      />
    </>
  );
}
