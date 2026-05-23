import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function LoginPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Acesso administrativo"
        title="Login"
        description="Base visual da tela de entrada da administração. A autenticação será conectada em uma próxima etapa."
      />
      <Card className="max-w-md">
        <CardHeader>
          <h2 className="text-lg font-bold text-lindao-navy">
            Área protegida
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-slate-600">
            Formulário de login reservado para a implementação de autenticação.
          </p>
        </CardContent>
      </Card>
    </PublicShell>
  );
}
