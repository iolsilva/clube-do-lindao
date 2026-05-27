"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deletePurchaseAction,
  updatePurchaseAction,
  type PurchaseFormState,
} from "@/app/admin/compras/actions";
import { Button } from "@/components/ui/button";
import {
  calculatePointsFromCents,
  formatCurrencyFromCents,
  formatPoints,
  parseCurrencyToCents,
  toDateTimeLocalValue,
} from "@/lib/formatters";

type PurchaseCustomerOption = {
  active: boolean;
  code: string | null;
  id: string;
  name: string;
};

type PurchaseRowActionsProps = {
  customers: PurchaseCustomerOption[];
  purchase: {
    amountCents: number;
    customerId: string;
    id: string;
    notes: string | null;
    purchasedAt: string;
  };
};

const initialState: PurchaseFormState = {};

function formatCurrencyInput(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-semibold text-red-300">{message}</p>;
}

function EditSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending ? "Salvando..." : "Salvar alterações"}
    </Button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending ? "Excluindo..." : "Excluir compra"}
    </Button>
  );
}

export function PurchaseRowActions({
  customers,
  purchase,
}: PurchaseRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [state, formAction] = useActionState(
    updatePurchaseAction,
    initialState,
  );
  const [totalAmount, setTotalAmount] = useState(
    state.values?.totalAmount ?? formatCurrencyInput(purchase.amountCents),
  );
  const currentCustomerId = state.values?.customerId ?? purchase.customerId;
  const fieldClassName =
    "h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20";
  const labelClassName =
    "text-[11px] font-black uppercase tracking-[0.14em] text-slate-300";
  const previewPoints = useMemo(() => {
    const cents = parseCurrencyToCents(totalAmount);

    return cents ? calculatePointsFromCents(cents) : null;
  }, [totalAmount]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="h-8 px-3 text-xs"
          onClick={() => setIsEditOpen(true)}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 border-red-400/30 px-3 text-xs text-red-200 hover:border-red-300/50 hover:bg-red-500/10"
          onClick={() => setIsDeleteOpen(true)}
        >
          Excluir
        </Button>
      </div>

      {isEditOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-lindao-dark/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-lindao-gold/35 bg-[linear-gradient(145deg,rgba(10,23,64,0.98),rgba(6,15,46,0.96))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
                Correção de compra
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Editar compra
              </h2>
            </div>

            <form action={formAction} className="grid gap-4 p-4">
              <input name="purchaseId" type="hidden" value={purchase.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <label className={labelClassName} htmlFor="edit-customerId">
                    Cliente
                  </label>
                  <select
                    id="edit-customerId"
                    name="customerId"
                    defaultValue={currentCustomerId}
                    className={fieldClassName}
                    required
                  >
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.code ? ` | ${customer.code}` : ""}
                        {customer.active ? "" : " | Inativo"}
                      </option>
                    ))}
                  </select>
                  <FieldError message={state.fieldErrors?.customerId} />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClassName} htmlFor="edit-purchasedAt">
                    Data e hora
                  </label>
                  <input
                    id="edit-purchasedAt"
                    name="purchasedAt"
                    type="datetime-local"
                    defaultValue={
                      state.values?.purchasedAt ??
                      toDateTimeLocalValue(new Date(purchase.purchasedAt))
                    }
                    className={fieldClassName}
                    required
                  />
                  <FieldError message={state.fieldErrors?.purchasedAt} />
                </div>

                <div className="grid gap-1.5">
                  <label className={labelClassName} htmlFor="edit-totalAmount">
                    Valor total
                  </label>
                  <input
                    id="edit-totalAmount"
                    name="totalAmount"
                    inputMode="decimal"
                    required
                    value={totalAmount}
                    onChange={(event) => setTotalAmount(event.target.value)}
                    className={fieldClassName}
                    placeholder="Ex.: 100,00"
                  />
                  <FieldError message={state.fieldErrors?.totalAmount} />
                </div>
              </div>

              <div className="rounded-md border border-lindao-gold/25 bg-lindao-gold/10 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lindao-gold">
                  Pontos recalculados
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {previewPoints === null ? "0" : formatPoints(previewPoints)}{" "}
                  pontos
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className={labelClassName} htmlFor="edit-notes">
                  Observações
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={state.values?.notes ?? purchase.notes ?? ""}
                  rows={3}
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
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancelar
                </Button>
                <EditSubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-lindao-dark/80 px-4 py-6 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-red-300/35 bg-[linear-gradient(145deg,rgba(10,23,64,0.98),rgba(6,15,46,0.96))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-200">
                Excluir compra
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Confirmar exclusão
              </h2>
            </div>

            <form action={deletePurchaseAction} className="grid gap-4 p-4">
              <input name="purchaseId" type="hidden" value={purchase.id} />
              <input
                name="customerId"
                type="hidden"
                value={purchase.customerId}
              />

              <p className="text-sm leading-6 text-slate-200">
                Tem certeza que deseja excluir esta compra? Os pontos gerados
                por ela também deixarão de contar para o cliente.
              </p>

              <div className="rounded-md border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
                {formatCurrencyFromCents(purchase.amountCents)} serão removidos
                do histórico.
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-4"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Cancelar
                </Button>
                <DeleteSubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
