import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function EmptyState({ eyebrow, title, description }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-lindao-gold/25">
      <CardContent className="flex min-h-56 flex-col items-start justify-center gap-4">
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-lindao-navy">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
