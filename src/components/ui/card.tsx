import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-lindao-gold/18 bg-[linear-gradient(145deg,rgba(10,23,64,0.96),rgba(6,15,46,0.92))] text-slate-200 shadow-[0_20px_62px_rgba(0,0,0,0.26)] transition duration-200 hover:-translate-y-0.5 hover:border-lindao-gold/35 hover:shadow-[0_26px_74px_rgba(0,0,0,0.34)] [&_.bg-emerald-50]:bg-emerald-400/10 [&_.bg-slate-50]:bg-white/5 [&_.bg-slate-100]:bg-white/10 [&_.text-emerald-700]:text-emerald-300 [&_.text-emerald-800]:text-emerald-300 [&_.text-lindao-blue]:text-lindao-gold [&_.text-lindao-navy]:text-white [&_.text-slate-500]:text-slate-300 [&_.text-slate-600]:text-slate-300 [&_.text-slate-700]:text-slate-200 [&_dt]:text-white [&_h2]:text-white [&_h3]:text-white [&_summary]:text-lindao-gold",
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
        "border-b border-white/10 bg-white/[0.035] p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}
