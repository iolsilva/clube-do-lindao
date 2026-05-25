import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  href?: string;
};

export function Brand({ href = "/ranking" }: BrandProps) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <span className="relative flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-lindao-gold/20 bg-transparent drop-shadow-[0_12px_24px_rgba(245,197,24,0.18)]">
        <Image
          src="/images/logo.png"
          alt="Clube do Lindao"
          fill
          priority
          sizes="112px"
          className="object-contain"
        />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-black uppercase tracking-wide text-white">
          Clube do Lindão
        </span>
        <span className="block text-xs font-bold text-lindao-gold">
          Depósito São Marcos
        </span>
      </span>
    </Link>
  );
}
