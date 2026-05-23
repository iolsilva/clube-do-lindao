import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {eyebrow ? <Badge>{eyebrow}</Badge> : null}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-normal text-lindao-navy sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
