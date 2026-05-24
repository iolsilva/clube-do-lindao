import { cn } from "@/lib/utils";

type AlertVariant = "error" | "info" | "success" | "warning";

type AlertProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: AlertVariant;
};

const variants: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-lindao-line bg-lindao-blue-soft text-lindao-navy",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-lindao-gold/50 bg-lindao-gold-soft text-lindao-navy",
};

export function Alert({
  children,
  className,
  title,
  variant = "info",
}: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm",
        variants[variant],
        className,
      )}
    >
      {title ? <p className="font-black">{title}</p> : null}
      <div className={title ? "mt-1 font-medium" : "font-semibold"}>
        {children}
      </div>
    </div>
  );
}

