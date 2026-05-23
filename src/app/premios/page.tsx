import { PublicShell } from "@/components/layout/public-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export default function PremiosPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Área pública"
        title="Prêmios"
        description="Clientes poderão consultar os prêmios disponíveis no programa de vantagens."
      />
      <EmptyState
        eyebrow="Em breve"
        title="Catálogo de prêmios vazio"
        description="Os prêmios serão cadastrados na administração quando o CRUD for implementado."
      />
    </PublicShell>
  );
}
