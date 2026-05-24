import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-lindao-blue text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] hover:bg-[#2563eb] focus-visible:outline-lindao-blue",
  secondary:
    "border border-lindao-gold/30 bg-lindao-gold/10 text-lindao-gold shadow-sm hover:border-lindao-gold hover:bg-lindao-gold/20 focus-visible:outline-lindao-gold",
  ghost:
    "text-white hover:bg-white/10 focus-visible:outline-lindao-blue",
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
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
