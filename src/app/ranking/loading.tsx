import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RankingLoading() {
  return (
    <PublicShell>
      <PageHeader
        eyebrow="Area publica"
        title="Ranking Clube do Lindao"
        description="Carregando pontuacoes atualizadas."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="grid min-h-56 content-between gap-6">
              <Skeleton className="h-8 w-24" />
              <div className="grid gap-3">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </PublicShell>
  );
}

