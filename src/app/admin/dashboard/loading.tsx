import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Painel"
        description="Carregando indicadores."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]"
          >
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-10 w-24" />
            <Skeleton className="mt-4 h-4 w-full" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-3 h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="grid gap-4">
              {Array.from({ length: 4 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid gap-3 rounded-md border border-lindao-line p-4"
                >
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
