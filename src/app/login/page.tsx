import { LoginForm } from "@/components/auth/login-form";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function LoginPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Acesso administrativo"
        title="Login"
        description="Entre com uma conta autorizada no Supabase Auth para acessar a administração."
      />
      <Card className="max-w-md">
        <CardHeader>
          <h2 className="text-lg font-bold text-lindao-navy">
            Area protegida
          </h2>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </PublicShell>
  );
}
