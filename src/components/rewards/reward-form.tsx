"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveRewardAction,
  type RewardFormState,
} from "@/app/admin/premios/actions";
import { Button } from "@/components/ui/button";

export type RewardFormReward = {
  active: boolean;
  description: string | null;
  id: string;
  pointsRequired: number;
  title: string;
};

type RewardFormProps = {
  cancelHref?: string;
  mode: "create" | "edit";
  reward?: RewardFormReward;
};

const initialState: RewardFormState = {};

function SubmitButton({ mode }: { mode: RewardFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Cadastrar prêmio"
          : "Salvar alterações"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-700">{message}</p>;
}

export function RewardForm({ cancelHref, mode, reward }: RewardFormProps) {
  const [state, formAction] = useActionState(saveRewardAction, initialState);
  const values = state.values;
  const fieldClassName =
    "h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20";
  const labelClassName =
    "text-[11px] font-black uppercase tracking-[0.14em] text-slate-300";

  return (
    <form action={formAction} className="grid gap-4">
      {reward ? <input type="hidden" name="id" value={reward.id} /> : null}

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-reward-title-${reward?.id ?? "new"}`}
          className={labelClassName}
        >
          Título
        </label>
        <input
          id={`${mode}-reward-title-${reward?.id ?? "new"}`}
          name="title"
          defaultValue={values?.title ?? reward?.title ?? ""}
          required
          className={fieldClassName}
          placeholder="Ex.: Vale-compras"
        />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-reward-description-${reward?.id ?? "new"}`}
          className={labelClassName}
        >
          Descrição
        </label>
        <textarea
          id={`${mode}-reward-description-${reward?.id ?? "new"}`}
          name="description"
          defaultValue={values?.description ?? reward?.description ?? ""}
          rows={3}
          className="min-h-24 rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
          placeholder="Detalhes do prêmio"
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-reward-points-${reward?.id ?? "new"}`}
          className={labelClassName}
        >
          Pontos necessários
        </label>
        <input
          id={`${mode}-reward-points-${reward?.id ?? "new"}`}
          name="pointsRequired"
          inputMode="decimal"
          defaultValue={values?.pointsRequired ?? reward?.pointsRequired ?? ""}
          required
          className={fieldClassName}
          placeholder="Ex.: 150"
        />
        <FieldError message={state.fieldErrors?.pointsRequired} />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <input
            name="active"
            type="checkbox"
            defaultChecked={values?.active ?? reward?.active ?? true}
            className="size-4 shrink-0 align-middle accent-lindao-gold"
          />
          Prêmio ativo
        </label>
        <div className="flex flex-wrap gap-2">
          {cancelHref ? (
            <a
              href={cancelHref}
              className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-black text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Cancelar edição
            </a>
          ) : null}
        <SubmitButton mode={mode} />
        </div>
      </div>
    </form>
  );
}
