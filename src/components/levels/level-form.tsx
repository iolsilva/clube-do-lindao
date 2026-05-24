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
  level?: LevelFormLevel;
  mode: "create" | "edit";
};

const initialState: LevelFormState = {};

function SubmitButton({ mode }: { mode: LevelFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Criar nivel"
          : "Salvar nivel"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-700">{message}</p>;
}

export function LevelForm({ level, mode }: LevelFormProps) {
  const [state, formAction] = useActionState(saveLevelAction, initialState);
  const values = state.values;

  return (
    <form action={formAction} className="grid gap-5">
      {level ? <input type="hidden" name="id" value={level.id} /> : null}

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-level-name-${level?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Nome
        </label>
        <input
          id={`${mode}-level-name-${level?.id ?? "new"}`}
          name="name"
          defaultValue={values?.name ?? level?.name ?? ""}
          required
          className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Ex.: Ouro"
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-level-description-${level?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Descricao
        </label>
        <textarea
          id={`${mode}-level-description-${level?.id ?? "new"}`}
          name="description"
          defaultValue={values?.description ?? level?.description ?? ""}
          rows={3}
          className="rounded-md border border-lindao-line bg-white px-3 py-2 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Beneficios ou observacoes do nivel"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-level-sort-${level?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Ordem
        </label>
        <input
          id={`${mode}-level-sort-${level?.id ?? "new"}`}
          name="sortOrder"
          type="number"
          step="1"
          defaultValue={values?.sortOrder ?? level?.sortOrder ?? "0"}
          className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
        />
        <FieldError message={state.fieldErrors?.sortOrder} />
      </div>

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
