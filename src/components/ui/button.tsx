import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-lindao-blue text-white shadow-[0_10px_24px_rgba(21,85,160,0.22)] hover:bg-lindao-navy focus-visible:outline-lindao-blue",
  secondary:
    "border border-lindao-line bg-white text-lindao-navy shadow-sm hover:border-lindao-gold hover:bg-lindao-gold-soft focus-visible:outline-lindao-gold",
  ghost:
    "text-lindao-navy hover:bg-lindao-blue-soft focus-visible:outline-lindao-blue",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
