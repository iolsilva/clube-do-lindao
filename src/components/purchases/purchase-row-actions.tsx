"use client";

import {
  type ReactNode,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

type PurchaseRowActionsProps = {
  purchase: {
    amountCents: number;
    customerCode: string | null;
    customerId: string;
    customerName: string;
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
    <Button type="submit" disabled={pending} className="h-10 px-5">
      {pending ? "Salvando..." : "Salvar alterações"}
    </Button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-10 px-5">
      {pending ? "Excluindo..." : "Excluir compra"}
    </Button>
  );
}

function DialogPortal({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

function DialogFrame({
  children,
  onClose,
  tone = "gold",
}: {
  children: ReactNode;
  onClose: () => void;
  tone?: "gold" | "red";
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020817]/85 px-3 py-5 backdrop-blur-md sm:px-6"
      role="dialog"
    >
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          "relative w-[95vw] overflow-hidden rounded-xl border bg-[linear-gradient(145deg,rgba(10,23,64,0.99),rgba(6,15,46,0.98))] text-white shadow-[0_32px_110px_rgba(0,0,0,0.56)] outline-none",
          "max-h-[90vh] max-w-[680px]",
          tone === "red" ? "border-red-300/35" : "border-lindao-gold/35",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-56 rounded-full bg-lindao-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-10 size-64 rounded-full bg-lindao-blue/20 blur-3xl" />
        <div className="relative max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function EditPurchaseDialog({
  isOpen,
  onClose,
  purchase,
}: PurchaseRowActionsProps & {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    updatePurchaseAction,
    initialState,
  );
  const [totalAmount, setTotalAmount] = useState(
    state.values?.totalAmount ?? formatCurrencyInput(purchase.amountCents),
  );
  const labelClassName =
    "text-[11px] font-black uppercase tracking-[0.14em] text-slate-300";
  const fieldClassName =
    "h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20";
  const previewPoints = useMemo(() => {
    const cents = parseCurrencyToCents(totalAmount);

    return cents ? calculatePointsFromCents(cents) : null;
  }, [totalAmount]);

  return (
    <DialogPortal isOpen={isOpen} onClose={onClose}>
      <DialogFrame onClose={onClose}>
        <div className="border-b border-white/10 bg-white/[0.035] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lindao-gold">
            Correção de compra
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Editar compra</h2>
        </div>

        <form action={formAction} className="grid gap-4 px-5 py-5 sm:px-6">
          <input name="purchaseId" type="hidden" value={purchase.id} />
          <input name="customerId" type="hidden" value={purchase.customerId} />

          <div className="rounded-lg border border-lindao-gold/20 bg-lindao-gold/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lindao-gold">
              Cliente selecionado
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-black text-white">
                {purchase.customerName}
              </p>
              {purchase.customerCode ? (
                <span className="w-fit rounded-full border border-lindao-gold/35 bg-lindao-gold/15 px-3 py-1 text-xs font-black text-lindao-gold">
                  {purchase.customerCode}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="rounded-lg border border-lindao-gold/25 bg-lindao-gold/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lindao-gold">
              Pontos calculados
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {previewPoints === null ? "0" : formatPoints(previewPoints)}
              <span className="ml-2 text-base text-slate-300">pontos</span>
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
              className="h-10 px-5"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <EditSubmitButton />
          </div>
        </form>
      </DialogFrame>
    </DialogPortal>
  );
}

function DeletePurchaseDialog({
  isOpen,
  onClose,
  purchase,
}: PurchaseRowActionsProps & {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <DialogPortal isOpen={isOpen} onClose={onClose}>
      <DialogFrame onClose={onClose} tone="red">
        <div className="border-b border-white/10 bg-white/[0.035] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-200">
            Excluir compra
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Excluir compra?
          </h2>
        </div>

        <form action={deletePurchaseAction} className="grid gap-4 px-5 py-5 sm:px-6">
          <input name="purchaseId" type="hidden" value={purchase.id} />
          <input name="customerId" type="hidden" value={purchase.customerId} />

          <p className="text-sm leading-6 text-slate-200">
            Os pontos gerados por esta compra deixarão de contar para o cliente.
          </p>

          <div className="rounded-lg border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <p className="font-black">{purchase.customerName}</p>
            <p className="mt-1 font-semibold">
              {formatCurrencyFromCents(purchase.amountCents)} serão removidos
              do histórico.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-5"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <DeleteSubmitButton />
          </div>
        </form>
      </DialogFrame>
    </DialogPortal>
  );
}

export function PurchaseRowActions({ purchase }: PurchaseRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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
        <EditPurchaseDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          purchase={purchase}
        />
      ) : null}
      {isDeleteOpen ? (
        <DeletePurchaseDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          purchase={purchase}
        />
      ) : null}
    </>
  );
}
