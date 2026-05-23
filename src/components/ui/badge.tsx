import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-lindao-gold/40 bg-lindao-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lindao-navy",
        className,
      )}
    >
      {children}
    </span>
  );
}
