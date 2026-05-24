import Link from "next/link";

export function Brand() {
  return (
    <Link href="/ranking" className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-md border border-lindao-gold/40 bg-lindao-gold text-base font-black text-lindao-navy shadow-[0_12px_28px_rgba(214,166,44,0.28)]">
        CL
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-black uppercase tracking-wide text-lindao-navy">
          Clube do Lindão
        </span>
        <span className="block text-xs font-medium text-slate-500">
          Vantagens para clientes
        </span>
      </span>
    </Link>
  );
}
