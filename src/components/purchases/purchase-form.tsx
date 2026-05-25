"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createPurchaseAction,
  type PurchaseFormState,
} from "@/app/admin/compras/actions";
import { Button } from "@/components/ui/button";
import {
  calculatePointsFromCents,
  formatPoints,
  parseCurrencyToCents,
} from "@/lib/formatters";

type PurchaseFormProps = {
  customerId: string;
  defaultPurchasedAt: string;
};

const initialState: PurchaseFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending ? "Salvando..." : "Registrar compra"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-700">{message}</p>;
}

export function PurchaseForm({
  customerId,
  defaultPurchasedAt,
}: PurchaseFormProps) {
  const [state, formAction] = useActionState(
    createPurchaseAction,
    initialState,
  );
  const [totalAmount, setTotalAmount] = useState(
    state.values?.totalAmount ?? "",
  );
  const previewPoints = useMemo(() => {
    const cents = parseCurrencyToCents(totalAmount);

    if (!cents) {
      return null;
    }

    return calculatePointsFromCents(cents);
  }, [totalAmount]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="customerId" value={customerId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="purchasedAt"
            className="text-[11px] font-black uppercase tracking-wide text-slate-300"
          >
            Data e hora
          </label>
          <input
            id="purchasedAt"
            name="purchasedAt"
            type="datetime-local"
            defaultValue={state.values?.purchasedAt ?? defaultPurchasedAt}
            required
            className="h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
          />
          <FieldError message={state.fieldErrors?.purchasedAt} />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="totalAmount"
            className="text-[11px] font-black uppercase tracking-wide text-slate-300"
          >
            Valor total
          </label>
          <input
            id="totalAmount"
            name="totalAmount"
            inputMode="decimal"
            required
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            className="h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
            placeholder="Ex.: 100,00"
          />
          <FieldError message={state.fieldErrors?.totalAmount} />
        </div>
      </div>

      <div className="rounded-md border border-lindao-gold/25 bg-lindao-gold/10 px-3 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lindao-gold">
          Pontos calculados
        </p>
        <p className="mt-1 text-2xl font-black text-white">
          {previewPoints === null ? "0" : formatPoints(previewPoints)} pontos
        </p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="notes"
          className="text-[11px] font-black uppercase tracking-wide text-slate-300"
        >
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={state.values?.notes ?? ""}
          rows={2}
          className="min-h-20 rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
          placeholder="Opcional"
        />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
