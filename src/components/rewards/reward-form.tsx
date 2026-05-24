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
  mode: "create" | "edit";
  reward?: RewardFormReward;
};

const initialState: RewardFormState = {};

function SubmitButton({ mode }: { mode: RewardFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Criar premio"
          : "Salvar premio"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-700">{message}</p>;
}

export function RewardForm({ mode, reward }: RewardFormProps) {
  const [state, formAction] = useActionState(saveRewardAction, initialState);
  const values = state.values;

  return (
    <form action={formAction} className="grid gap-5">
      {reward ? <input type="hidden" name="id" value={reward.id} /> : null}

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-reward-title-${reward?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Titulo
        </label>
        <input
          id={`${mode}-reward-title-${reward?.id ?? "new"}`}
          name="title"
          defaultValue={values?.title ?? reward?.title ?? ""}
          required
          className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Ex.: Vale-compras"
        />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-reward-description-${reward?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Descricao
        </label>
        <textarea
          id={`${mode}-reward-description-${reward?.id ?? "new"}`}
          name="description"
          defaultValue={values?.description ?? reward?.description ?? ""}
          rows={3}
          className="rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Detalhes do premio"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-reward-points-${reward?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Pontos necessarios
        </label>
        <input
          id={`${mode}-reward-points-${reward?.id ?? "new"}`}
          name="pointsRequired"
          inputMode="decimal"
          defaultValue={values?.pointsRequired ?? reward?.pointsRequired ?? ""}
          required
          className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Ex.: 150"
        />
        <FieldError message={state.fieldErrors?.pointsRequired} />
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-lindao-navy">
        <input
          name="active"
          type="checkbox"
          defaultChecked={values?.active ?? reward?.active ?? true}
          className="size-4 rounded border-lindao-line text-lindao-blue"
        />
        Premio ativo
      </label>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <div>
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
