import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminComprasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Compras"
        description="Registro das compras que irão gerar pontos para os clientes."
      />
      <EmptyState
        eyebrow="Sem CRUD"
        title="Registro de compras ainda vazio"
        description="A entrada de compras e o cálculo de pontos serão implementados junto com o banco de dados."
      />
    </>
  );
}
