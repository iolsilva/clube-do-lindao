import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Visão inicial da operação do Clube do Lindão."
      />
      <EmptyState
        eyebrow="Base inicial"
        title="Dashboard pronto para evoluir"
        description="Indicadores, atalhos e resumos serão conectados quando o banco e as regras de negócio forem implementados."
      />
    </>
  );
}
