import Link from "next/link";

export function Brand() {
  return (
    <Link href="/ranking" className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-md bg-lindao-gold text-base font-black text-lindao-navy">
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
