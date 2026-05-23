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
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar compra"}
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
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="customerId" value={customerId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor="purchasedAt"
            className="text-sm font-semibold text-lindao-navy"
          >
            Data e hora
          </label>
          <input
            id="purchasedAt"
            name="purchasedAt"
            type="datetime-local"
            defaultValue={state.values?.purchasedAt ?? defaultPurchasedAt}
            required
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          />
          <FieldError message={state.fieldErrors?.purchasedAt} />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="totalAmount"
            className="text-sm font-semibold text-lindao-navy"
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
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
            placeholder="Ex.: 100,00"
          />
          <FieldError message={state.fieldErrors?.totalAmount} />
        </div>
      </div>

      <div className="rounded-md border border-lindao-line bg-lindao-blue-soft px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-lindao-blue">
          Pontos calculados
        </p>
        <p className="mt-1 text-2xl font-black text-lindao-navy">
          {previewPoints === null ? "0" : formatPoints(previewPoints)} pontos
        </p>
        <p className="mt-1 text-xs text-slate-600">
          O valor final e validado novamente no servidor antes de salvar.
        </p>
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="notes"
          className="text-sm font-semibold text-lindao-navy"
        >
          Observacoes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={state.values?.notes ?? ""}
          rows={3}
          className="rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Opcional"
        />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
