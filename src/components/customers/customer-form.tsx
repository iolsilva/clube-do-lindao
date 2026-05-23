"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveCustomerAction,
  type CustomerFormState,
} from "@/app/admin/clientes/actions";
import { Button } from "@/components/ui/button";

export type LevelOption = {
  id: string;
  name: string;
};

export type CustomerFormCustomer = {
  id: string;
  code: string | null;
  name: string;
  documentType: "cpf" | "cnpj";
  document: string;
  phone: string;
  levelId: string | null;
  active: boolean;
};

type CustomerFormProps = {
  customer?: CustomerFormCustomer;
  levels: LevelOption[];
  mode: "create" | "edit";
};

const initialState: CustomerFormState = {};

function SubmitButton({ mode }: { mode: CustomerFormProps["mode"] }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Salvando..."
        : mode === "create"
          ? "Cadastrar cliente"
          : "Salvar alteracoes"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-red-700">{message}</p>;
}

export function CustomerForm({ customer, levels, mode }: CustomerFormProps) {
  const [state, formAction] = useActionState(
    saveCustomerAction,
    initialState,
  );
  const values = state.values;

  return (
    <form action={formAction} className="grid gap-5">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}

      {customer?.code ? (
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-lindao-navy">
            Codigo
          </label>
          <input
            value={customer.code}
            readOnly
            className="h-11 rounded-md border border-lindao-line bg-slate-50 px-3 text-sm font-semibold text-slate-600 outline-none"
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <label
          htmlFor={`${mode}-name-${customer?.id ?? "new"}`}
          className="text-sm font-semibold text-lindao-navy"
        >
          Nome completo
        </label>
        <input
          id={`${mode}-name-${customer?.id ?? "new"}`}
          name="name"
          defaultValue={values?.name ?? customer?.name ?? ""}
          required
          className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          placeholder="Nome do cliente"
        />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="grid gap-2">
          <label
            htmlFor={`${mode}-document-type-${customer?.id ?? "new"}`}
            className="text-sm font-semibold text-lindao-navy"
          >
            Tipo
          </label>
          <select
            id={`${mode}-document-type-${customer?.id ?? "new"}`}
            name="documentType"
            defaultValue={values?.documentType ?? customer?.documentType ?? "cpf"}
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          >
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${mode}-document-${customer?.id ?? "new"}`}
            className="text-sm font-semibold text-lindao-navy"
          >
            CPF ou CNPJ
          </label>
          <input
            id={`${mode}-document-${customer?.id ?? "new"}`}
            name="document"
            defaultValue={values?.document ?? customer?.document ?? ""}
            required
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
            placeholder="Somente numeros ou formatado"
          />
          <FieldError message={state.fieldErrors?.document} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label
            htmlFor={`${mode}-phone-${customer?.id ?? "new"}`}
            className="text-sm font-semibold text-lindao-navy"
          >
            Telefone
          </label>
          <input
            id={`${mode}-phone-${customer?.id ?? "new"}`}
            name="phone"
            defaultValue={values?.phone ?? customer?.phone ?? ""}
            required
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors placeholder:text-slate-400 focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
            placeholder="(00) 00000-0000"
          />
          <FieldError message={state.fieldErrors?.phone} />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${mode}-level-${customer?.id ?? "new"}`}
            className="text-sm font-semibold text-lindao-navy"
          >
            Nivel
          </label>
          <select
            id={`${mode}-level-${customer?.id ?? "new"}`}
            name="levelId"
            defaultValue={values?.levelId ?? customer?.levelId ?? ""}
            className="h-11 rounded-md border border-lindao-line bg-white px-3 text-sm text-lindao-navy outline-none transition-colors focus:border-lindao-blue focus:ring-2 focus:ring-lindao-blue/15"
          >
            <option value="">Sem nivel</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-semibold text-lindao-navy">
        <input
          name="active"
          type="checkbox"
          defaultChecked={values?.active ?? customer?.active ?? true}
          className="size-4 rounded border-lindao-line text-lindao-blue"
        />
        Cliente ativo
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
