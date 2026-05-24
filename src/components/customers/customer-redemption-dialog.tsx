"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  redeemCustomerPointsAction,
  type RedemptionFormState,
} from "@/app/admin/clientes/actions";
import { Button } from "@/components/ui/button";
import { formatPoints, toDateTimeLocalValue } from "@/lib/formatters";

type CustomerRedemptionDialogProps = {
  availablePoints: number;
  customerCode: string | null;
  customerId: string;
  customerName: string;
};

const initialState: RedemptionFormState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-semibold text-red-300">{message}</p>;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} className="h-9 px-4">
      {pending ? "Salvando..." : "Salvar resgate"}
    </Button>
  );
}

export function CustomerRedemptionDialog({
  availablePoints,
  customerCode,
  customerId,
  customerName,
}: CustomerRedemptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(
    redeemCustomerPointsAction,
    initialState,
  );
  const safeAvailablePoints = Math.max(availablePoints, 0);
  const formattedAvailablePoints = formatPoints(safeAvailablePoints);
  const fieldClassName =
    "h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20";
  const labelClassName =
    "text-[11px] font-black uppercase tracking-[0.14em] text-slate-300";

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-8 px-3 text-xs"
        onClick={() => setIsOpen(true)}
      >
        Resgate
      </Button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-lindao-dark/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-lindao-gold/35 bg-[linear-gradient(145deg,rgba(10,23,64,0.98),rgba(6,15,46,0.96))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                    Resgate de pontos
                  </p>
                  <h2 className="mt-1 text-lg font-black text-white">
                    {customerName}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    {customerCode ?? "Sem código"}
                  </p>
                </div>
                <div className="rounded-md border border-lindao-gold/25 bg-lindao-gold/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-300">
                    Disponível
                  </p>
                  <p className="text-xl font-black text-lindao-gold">
                    {formattedAvailablePoints}
                  </p>
                </div>
              </div>
            </div>

            <form action={formAction} className="grid gap-4 p-4">
              <input name="customerId" type="hidden" value={customerId} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className={labelClassName} htmlFor="pointsToRedeem">
                    Pontos a resgatar
                  </label>
                  <input
                    id="pointsToRedeem"
                    name="pointsToRedeem"
                    type="number"
                    min="0.01"
                    max={safeAvailablePoints || undefined}
                    step="0.01"
                    defaultValue={state.values?.pointsToRedeem ?? ""}
                    className={fieldClassName}
                    placeholder="0"
                    required
                  />
                  <FieldError message={state.fieldErrors?.pointsToRedeem} />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClassName} htmlFor="redemptionDate">
                    Data do resgate
                  </label>
                  <input
                    id="redemptionDate"
                    name="redemptionDate"
                    type="datetime-local"
                    defaultValue={
                      state.values?.redemptionDate ?? toDateTimeLocalValue()
                    }
                    className={fieldClassName}
                    required
                  />
                  <FieldError message={state.fieldErrors?.redemptionDate} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className={labelClassName} htmlFor="notes">
                  Observação
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={state.values?.notes ?? ""}
                  className="min-h-24 rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
                  placeholder="Opcional"
                />
              </div>

              {state.message ? (
                <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">
                  {state.message}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-4"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <SubmitButton disabled={safeAvailablePoints <= 0} />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
