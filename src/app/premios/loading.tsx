import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function PremiosLoading() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Area publica"
        title="Premios"
        description="Carregando premios ativos."
      />
      <section className="rounded-lg border border-lindao-gold/45 bg-lindao-gold-soft p-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-4 h-5 w-2/3" />
        <Skeleton className="mt-6 h-14 w-32" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="grid min-h-64 content-between gap-8">
              <div className="grid gap-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </section>
    </PublicShell>
  );
}

