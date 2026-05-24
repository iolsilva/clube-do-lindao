import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function LoginPage() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Acesso administrativo"
        title="Login"
        description="Entre com uma conta autorizada no Supabase Auth para acessar a administracao."
      />
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-stretch">
        <div className="relative hidden overflow-hidden rounded-lg border border-lindao-gold/30 bg-[radial-gradient(circle_at_70%_20%,rgba(245,197,24,0.2),transparent_16rem),linear-gradient(135deg,rgba(24,67,184,0.86),rgba(6,15,46,0.96))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.32)] lg:block">
          <div className="relative z-[1] max-w-md space-y-4">
            <Badge>Programa de Fidelidade Oficial</Badge>
            <h2 className="text-4xl font-black text-white">
              Comprou, pontuou, ganhou.
            </h2>
            <p className="text-base leading-7 text-slate-200">
              Administracao do Clube do Lindao para o Deposito Sao Marcos.
            </p>
          </div>
          <Image
            src="/images/boneco4.png"
            alt=""
            width={330}
            height={390}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-3 max-h-[300px] w-auto object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.34)]"
          />
        </div>
        <Card className="max-w-md lg:max-w-none">
          <CardHeader>
            <h2 className="text-lg font-bold text-lindao-navy">
              Area protegida
            </h2>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </section>
    </PublicShell>
  );
}
