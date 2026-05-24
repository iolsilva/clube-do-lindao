"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveLevelAction,
  type LevelFormState,
} from "@/app/admin/niveis/actions";
import { Button } from "@/components/ui/button";

export type LevelFormLevel = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

type LevelFormProps = {
  cancelHref?: string;
  level?: LevelFormLevel;
  mode: "create" | "edit";
};

const initialState: LevelFormState = {};

function SubmitButton({ mode }: { mode: LevelFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-9 px-4">
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Cadastrar nível"
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

export function LevelForm({ cancelHref, level, mode }: LevelFormProps) {
  const [state, formAction] = useActionState(saveLevelAction, initialState);
  const values = state.values;
  const fieldClassName =
    "h-10 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20";
  const labelClassName =
    "text-[11px] font-black uppercase tracking-[0.14em] text-slate-300";

  return (
    <form action={formAction} className="grid gap-4">
      {level ? <input type="hidden" name="id" value={level.id} /> : null}

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-level-name-${level?.id ?? "new"}`}
          className={labelClassName}
        >
          Nome
        </label>
        <input
          id={`${mode}-level-name-${level?.id ?? "new"}`}
          name="name"
          defaultValue={values?.name ?? level?.name ?? ""}
          required
          className={fieldClassName}
          placeholder="Ex.: Ouro"
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-level-description-${level?.id ?? "new"}`}
          className={labelClassName}
        >
          Descrição
        </label>
        <textarea
          id={`${mode}-level-description-${level?.id ?? "new"}`}
          name="description"
          defaultValue={values?.description ?? level?.description ?? ""}
          rows={3}
          className="min-h-24 rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-gold focus:ring-2 focus:ring-lindao-gold/20"
          placeholder="Benefícios ou observações do nível"
        />
      </div>

      <div className="grid gap-1.5">
        <label
          htmlFor={`${mode}-level-sort-${level?.id ?? "new"}`}
          className={labelClassName}
        >
          Ordem
        </label>
        <input
          id={`${mode}-level-sort-${level?.id ?? "new"}`}
          name="sortOrder"
          type="number"
          step="1"
          defaultValue={values?.sortOrder ?? level?.sortOrder ?? "0"}
          className={fieldClassName}
        />
        <FieldError message={state.fieldErrors?.sortOrder} />
      </div>

      {state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1 sm:justify-end">
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
    </form>
  );
}
