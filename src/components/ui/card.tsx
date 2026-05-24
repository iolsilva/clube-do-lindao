import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-[linear-gradient(145deg,rgba(10,23,64,0.96),rgba(6,15,46,0.9))] text-slate-200 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition duration-200 hover:border-lindao-gold/35 hover:shadow-[0_28px_90px_rgba(0,0,0,0.36)] [&_.bg-slate-50]:bg-white/5 [&_.text-lindao-navy]:text-white [&_.text-slate-500]:text-lindao-muted [&_.text-slate-600]:text-slate-300 [&_input]:border-white/15 [&_input]:bg-white [&_input]:text-[#06143a] [&_select]:border-white/15 [&_select]:bg-white [&_select]:text-[#06143a] [&_textarea]:border-white/15 [&_textarea]:bg-white [&_textarea]:text-[#06143a]",
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
        "border-b border-white/10 bg-white/[0.04] p-5",
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
