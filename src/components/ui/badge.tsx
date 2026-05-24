import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-lindao-gold/45 bg-lindao-gold/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-lindao-gold shadow-[0_10px_24px_rgba(245,197,24,0.12)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
