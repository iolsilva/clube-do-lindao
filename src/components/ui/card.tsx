import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-lindao-line/80 bg-white shadow-[0_18px_50px_rgba(12,36,72,0.07)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "border-b border-lindao-line/80 bg-slate-50/60 p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
