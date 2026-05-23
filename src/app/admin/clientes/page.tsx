import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminClientesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Clientes"
        description="Gestão dos participantes do clube de vantagens."
      />
      <EmptyState
        eyebrow="Sem CRUD"
        title="Cadastro de clientes ainda vazio"
        description="A criação, edição e consulta de clientes serão adicionadas em uma próxima etapa."
      />
    </>
  );
}
